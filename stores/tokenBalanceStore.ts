// TODO use getTokenAccountsByOwner to get all token accounts for a wallet
// see https://www.helius.dev/docs/rpc/optimization-techniques#efficient-token-balance-lookup

import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { create } from 'zustand';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { CONNECTION, WSOL_MINT } from '@/services/walletService';
import { getAllTokenInfo } from '@/data/tokens'; // Assuming EnrichedTokenEntry is exported from tokens
import { EnrichedTokenEntry } from '@/data/types';

const PING_INTERVAL = 20000; // 20 seconds for heartbeat pings

// Define the shape of the balance information
export interface LiveBalanceInfo {
    balance: number; // Human-readable balance
    rawBalance: bigint;
}

export interface TokenBalanceDetails  {
    balance: number; // Human-readable balance
    rawBalance: bigint; // Raw balance in the smallest unit (e.g., lamports for SOL)
    decimals: number; // Number of decimals for the token
    decimalsShown: number; // Number of decimals shown in UI
    address: string; // Mint address of the token
    symbol: string; // Symbol of the token
    name: string; // Name of the token
    logoURI: string; // Optional logo URI for the token
    loading: boolean;
    error: Error | null;
}


// BalancesState will map mint address to this detailed status
export interface TokenBalancesMap {
    [mintAddress: string]: TokenBalanceDetails;
}

const allTokens = getAllTokenInfo();

interface TokenBalanceStoreState {
    tokenBalanceDetails: TokenBalancesMap; // Renamed from balances
    activeWalletPublicKey: string | null;
    ws: WebSocket | null;
    wsError: Error | null; // For WebSocket specific connection/protocol errors
    storeError: Error | null; // For errors in the store's own logic/operations
    requestIdToMintAddress: Record<number, string>;
    rpcSubIdToMintAddress: Record<number, string>;
    isConnectingOrFetching: boolean; // Indicates overall process of fetching/connecting
    pingInterval: NodeJS.Timeout | null; // For keep-alive pings
    reconnectTimeout: NodeJS.Timeout | null; // For reconnection attempts
    reconnectAttempts: number; // Track reconnection attempts
    connectionStartTime: number | null; // Track when connection started for debugging

    // Actions
    subscribeToTokenBalances: (walletPublicKeyStr: string | null) => Promise<void>;
    _initializeBalances: () => void;
    _fetchInitialBalances: (walletPublicKey: PublicKey) => Promise<void>;
    _connectWebSocket: (walletPublicKey: PublicKey) => void;
    _disconnectWebSocket: () => void;
    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => void;
    _setupHeartbeat: () => void;
    _clearHeartbeat: () => void;
    _scheduleReconnect: (walletPublicKey: PublicKey) => void;
    _clearReconnect: () => void;
}

async function fetchNativeSolBalance(walletPublicKey: PublicKey): Promise<{ address: string; balance: number; rawBalance: bigint }> {
    try {
        const lamports = await CONNECTION.getBalance(walletPublicKey);
        return {
            address: WSOL_MINT,
            balance: lamports / LAMPORTS_PER_SOL,
            rawBalance: BigInt(lamports),
        };
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        return {
            address: WSOL_MINT,
            balance: 0,
            rawBalance: BigInt(0),
        };
    }
}

const fetchSplTokenBalance = async (
    token: EnrichedTokenEntry,
    walletPublicKey: PublicKey
): Promise<{ address: string; balance: number; rawBalance: bigint }> => {
    const mintPublicKey = new PublicKey(token.address);
    const ata = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey, false);
    try {
        const accountInfo = await getAccount(CONNECTION, ata);
        return {
            address: token.address,
            balance: Number(accountInfo.amount) / (10 ** token.decimals),
            rawBalance: accountInfo.amount,
        };
    } catch (e: any) {
        if (e.name === 'TokenAccountNotFoundError' || e.message?.includes('could not find account')) {
            return {
                address: token.address,
                balance: 0,
                rawBalance: BigInt(0),
            };
        }
        console.error(`Error fetching balance for ${token.symbol}:`, e);
        // For a single token fetch error, we might still return 0 balance or let it be handled by overall error state
        return { address: token.address, balance: 0, rawBalance: BigInt(0) }; // Or throw to set global error
    }
};

export const useTokenBalanceStore = create<TokenBalanceStoreState>((set, get) => ({
    tokenBalanceDetails: {}, // Renamed from balances
    // loading: false, // REMOVED
    // error: null, // REMOVED
    activeWalletPublicKey: null,
    ws: null,
    wsError: null, // ADDED
    storeError: null, // ADDED
    requestIdToMintAddress: {},
    rpcSubIdToMintAddress: {},
    isConnectingOrFetching: false,
    pingInterval: null,
    reconnectTimeout: null,
    reconnectAttempts: 0,
    connectionStartTime: null,

    _initializeBalances: () => {
        const initialTokenBalanceDetails: TokenBalancesMap = {}; // Renamed variable
        allTokens.forEach(token => {
            initialTokenBalanceDetails[token.address] = { // Updated variable
                ...token,
                balance: 0,
                rawBalance: BigInt(0),
                loading: false, // Initialize per-token loading
                error: null,    // Initialize per-token error
            };
        });
        set({ tokenBalanceDetails: initialTokenBalanceDetails, storeError: null, wsError: null }); // Renamed property
    },

    _fetchInitialBalances: async (walletPublicKey: PublicKey) => {
        get()._initializeBalances(); // Resets all to 0, loading false, error null

        // Mark all tokens as loading before starting fetches
        set(state => {
            const newTokenBalanceDetails = { ...state.tokenBalanceDetails }; // Renamed variable and property
            allTokens.forEach(token => {
                // Ensure token entry exists from _initializeBalances
                if (newTokenBalanceDetails[token.address]) { // Updated variable
                    newTokenBalanceDetails[token.address].loading = true; // Updated variable
                    newTokenBalanceDetails[token.address].error = null; // Updated variable
                } else {
                    // Fallback, though _initializeBalances should cover this
                    newTokenBalanceDetails[token.address] = { // Updated variable
                        ...allTokens.find(t => t.address === token.address)!,
                        balance: 0,
                        rawBalance: BigInt(0),
                        loading: true,
                        error: null,
                    };
                }
            });
            return { tokenBalanceDetails: newTokenBalanceDetails, storeError: null }; // Renamed property
        });

        const balancePromises = allTokens.map(async (token) => {
            try {
                const result = token.address === WSOL_MINT
                    ? await fetchNativeSolBalance(walletPublicKey)
                    : await fetchSplTokenBalance(token, walletPublicKey);

                set(state => {
                    const newTokenBalanceDetails = { ...state.tokenBalanceDetails }; // Renamed variable and property
                    if (newTokenBalanceDetails[result.address]) { // Updated variable
                        newTokenBalanceDetails[result.address] = { // Updated variable
                            ...newTokenBalanceDetails[result.address], // Preserve existing EnrichedTokenEntry part // Updated variable
                            ...token, // Re-apply token base info in case it was a fallback init
                            balance: result.balance,
                            rawBalance: result.rawBalance,
                            loading: false,
                            error: null,
                        };
                    }
                    return { tokenBalanceDetails: newTokenBalanceDetails }; // Renamed property
                });
            } catch (e: any) {
                console.error(`Error fetching balance for ${token.symbol}:`, e);
                set(state => {
                    const newTokenBalanceDetails = { ...state.tokenBalanceDetails }; // Renamed variable and property
                    if (newTokenBalanceDetails[token.address]) { // Updated variable
                        newTokenBalanceDetails[token.address] = { // Updated variable
                            ...newTokenBalanceDetails[token.address], // Updated variable
                            loading: false,
                            error: e instanceof Error ? e : new Error(String(e)),
                        };
                    }
                    return { tokenBalanceDetails: newTokenBalanceDetails }; // Renamed property
                });
            }
        });

        await Promise.all(balancePromises);
    },

    _connectWebSocket: (walletPublicKey: PublicKey) => {
        if (get().ws) {
            console.log("WebSocket already connected or connecting.");
            return;
        }

        const state = get();
        state._clearReconnect(); // Clear any pending reconnect attempts

        const rpcEndpoint = CONNECTION.rpcEndpoint.replace(/^http/, 'ws');
        const newWs = new WebSocket(rpcEndpoint);
        let currentRequestIdToMintAddress: Record<number, string> = {};

        newWs.onopen = () => {
            const connectionTime = Date.now();
            console.log('WebSocket connection opened for token balance subscriptions (Zustand).');
            set({ ws: newWs, wsError: null, reconnectAttempts: 0, connectionStartTime: connectionTime }); // Clear errors and reset attempts on successful connection
            
            // Setup heartbeat to keep connection alive
            get()._setupHeartbeat();
            
            allTokens.forEach((token, idx) => {
                const isSol = token.address === WSOL_MINT;;
                const requestId = Date.now() + idx; // More unique request ID

                const addressToSubscribe = isSol
                    ? walletPublicKey
                    : getAssociatedTokenAddressSync(new PublicKey(token.address), walletPublicKey, false);

                currentRequestIdToMintAddress[requestId] = token.address;

                newWs.send(
                    JSON.stringify({
                        jsonrpc: "2.0",
                        id: requestId,
                        method: "accountSubscribe",
                        params: [
                            addressToSubscribe.toBase58(),
                            { encoding: "jsonParsed", commitment: "confirmed" },
                        ],
                    })
                );
            });
            set({ requestIdToMintAddress: currentRequestIdToMintAddress, rpcSubIdToMintAddress: {} });
        };

        newWs.onmessage = (event) => {
            const message = JSON.parse(event.data.toString());
            const state = get();

            console.log("WebSocket message received (Zustand):", message);

            // Handle different types of messages
            if (message.result && message.id && state.requestIdToMintAddress[message.id]) {
                // Subscription confirmation
                const mintAddress = state.requestIdToMintAddress[message.id];
                set(s => ({
                    rpcSubIdToMintAddress: { ...s.rpcSubIdToMintAddress, [message.result]: mintAddress },
                    requestIdToMintAddress: (({ [message.id]: _, ...rest }) => rest)(s.requestIdToMintAddress) // Remove handled ID
                }));
            } else if (message.method === "accountNotification") {
                // Account update notification
                const rpcSubscriptionId = message.params.subscription;
                const mintAddress = state.rpcSubIdToMintAddress[rpcSubscriptionId];
                const tokenInfo = allTokens.find(t => t.address === mintAddress);

                if (tokenInfo && message.params.result && message.params.result.value) {
                    const accountData = message.params.result.value.data;
                    let humanBalance = 0;
                    let rawAmount = BigInt(0);

                    if (accountData?.parsed?.info?.tokenAmount) {
                        humanBalance = parseFloat(accountData.parsed.info.tokenAmount.uiAmountString || '0');
                        rawAmount = BigInt(accountData.parsed.info.tokenAmount.amount || '0');
                    }
                    // Handle SOL balance if it's represented by lamports directly on the account
                    // This part might need adjustment based on how SOL is treated (is it in `allTokens` with a special address?)
                    else if (message.params.result.value.lamports !== undefined && tokenInfo.address === WSOL_MINT) {
                        // Assuming SOL is a token in your list and its balance comes from lamports
                        humanBalance = message.params.result.value.lamports / (10 ** tokenInfo.decimals);
                        rawAmount = BigInt(message.params.result.value.lamports);
                    }

                    state._updateBalance(mintAddress, humanBalance, rawAmount);
                } else if (tokenInfo && message.params.result && message.params.result.value === null) { // Account closed
                    state._updateBalance(mintAddress, 0, BigInt(0));
                }
            } else if (message.result !== undefined && typeof message.id === 'string' && message.id.startsWith('heartbeat_')) {
                // Heartbeat response - just log for debugging if needed
                // console.log('WebSocket heartbeat response received');
            } else if (message.error) {
                // Handle RPC errors
                if (message.error.code === -32601) {
                    // Method not found - this is expected for heartbeat on some RPC providers
                    // Don't log this as it's not a real error
                    return;
                }
                // Log other RPC errors as they might be important
                console.error('WebSocket RPC error:', message.error);
            }
        };

        newWs.onerror = (error) => {
            console.error("WebSocket error (Zustand):", error);
            set({ wsError: new Error("WebSocket connection error."), ws: null, isConnectingOrFetching: false });
            get()._clearHeartbeat(); // Clear heartbeat on error
        };

        newWs.onclose = (event) => {
            const startTime = get().connectionStartTime;
            const connectionDuration = startTime ? Date.now() - startTime : 0;
            console.log(`WebSocket connection closed after ${connectionDuration}ms. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
            get()._clearHeartbeat(); // Clear heartbeat on close
            
            if (get().ws === newWs) { // Only update if this is the active WebSocket instance
                set(state => ({
                    ws: null,
                    isConnectingOrFetching: false,
                    connectionStartTime: null,
                }));

                // Schedule reconnection if the close wasn't intentional (code 1000 is normal closure)
                // Also check if connection was short-lived (< 30 seconds) which might indicate server issues
                if (event.code !== 1000 && get().activeWalletPublicKey) {
                    if (connectionDuration < 30000) {
                        console.log('Connection was short-lived, indicating possible server issues');
                    }
                    console.log('Scheduling WebSocket reconnection...');
                    get()._scheduleReconnect(walletPublicKey);
                }
            }
        };
    },

    _disconnectWebSocket: () => {
        const currentWs = get().ws;
        const state = get();
        
        // Clear timers
        state._clearHeartbeat();
        state._clearReconnect();
        
        if (currentWs) {
            console.log("Closing WebSocket connection (Zustand).");
            currentWs.close(1000, 'Intentional disconnect'); // Normal closure
            set({ ws: null, rpcSubIdToMintAddress: {}, requestIdToMintAddress: {}, wsError: null, reconnectAttempts: 0, connectionStartTime: null });
        }
    },

    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => {
        set(state => {
            const tokenInfo = allTokens.find(t => t.address === mintAddress);
            if (!tokenInfo) return state; 

            const existingBalanceEntry = state.tokenBalanceDetails[mintAddress]; // Renamed property

            console.log("updating balance for", mintAddress, "to", balance);

            return {
                tokenBalanceDetails: { // Renamed property
                    ...state.tokenBalanceDetails, // Renamed property
                    [mintAddress]: {
                        ...(existingBalanceEntry || tokenInfo), 
                        ...tokenInfo, // Ensure all base token props are present
                        balance,
                        rawBalance,
                        loading: false, // Mark as not loading on WebSocket update
                        error: null,    // Clear any previous error on WebSocket update
                    },
                },
            };
        });
    },

    _setupHeartbeat: () => {
        get()._clearHeartbeat(); // Clear any existing heartbeat
        
        const pingInterval = setInterval(() => {
            const ws = get().ws;
            if (ws && ws.readyState === WebSocket.OPEN) {
                // Send a simple RPC call to keep the connection alive
                // Using getSlot which is lightweight and widely supported
                try {
                    ws.send(JSON.stringify({
                        jsonrpc: "2.0",
                        id: `heartbeat_${Date.now()}`,
                        method: "getSlot"
                    }));
                } catch (error) {
                    console.error('Failed to send heartbeat:', error);
                }
            }
        }, PING_INTERVAL); // Send ping every 20 seconds

        set({ pingInterval });
    },

    _clearHeartbeat: () => {
        const { pingInterval } = get();
        if (pingInterval) {
            clearInterval(pingInterval);
            set({ pingInterval: null });
        }
    },

    _scheduleReconnect: (walletPublicKey: PublicKey) => {
        const state = get();
        state._clearReconnect(); // Clear any existing reconnect timeout
        
        const maxAttempts = 5;
        const baseDelay = 1000; // 1 second base delay
        
        if (state.reconnectAttempts >= maxAttempts) {
            console.error('Max reconnection attempts reached. Stopping reconnection.');
            set({ wsError: new Error('Failed to reconnect after multiple attempts') });
            return;
        }

        const delay = baseDelay * Math.pow(2, state.reconnectAttempts); // Exponential backoff
        console.log(`Scheduling reconnection attempt ${state.reconnectAttempts + 1} in ${delay}ms`);

        const reconnectTimeout = setTimeout(() => {
            const currentState = get();
            if (currentState.activeWalletPublicKey && !currentState.ws) {
                set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
                currentState._connectWebSocket(walletPublicKey);
            }
        }, delay);

        set({ reconnectTimeout });
    },

    _clearReconnect: () => {
        const { reconnectTimeout } = get();
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            set({ reconnectTimeout: null });
        }
    },

    subscribeToTokenBalances: async (walletPublicKeyStr: string | null) => {
        const state = get();

        if (state.isConnectingOrFetching && state.activeWalletPublicKey === walletPublicKeyStr) {
            console.log("Already connecting/fetching for this wallet.");
            return;
        }

        set({ isConnectingOrFetching: true });

        if (!walletPublicKeyStr) {
            state._disconnectWebSocket();
            state._initializeBalances(); // Reset to 0 balances, loading false, error null
            set({ activeWalletPublicKey: null, isConnectingOrFetching: false, storeError: null, wsError: null, reconnectAttempts: 0, connectionStartTime: null });
            return;
        }

        if (state.activeWalletPublicKey !== walletPublicKeyStr) {
            state._disconnectWebSocket(); // Disconnect if wallet changed
            set({ activeWalletPublicKey: walletPublicKeyStr, tokenBalanceDetails: {}, storeError: null, wsError: null, reconnectAttempts: 0, connectionStartTime: null });
            state._initializeBalances(); // Initialize with 0s for the new wallet
        }

        // If WebSocket is not connected, or wallet changed, fetch initial and then connect
        try {
            set({ storeError: null, wsError: null }); // Clear previous errors before new attempt
            const walletPublicKey = new PublicKey(walletPublicKeyStr);
            await state._fetchInitialBalances(walletPublicKey); // Sets loading to false internally
            // Only connect WebSocket if not already connected for the current key
            if (!get().ws || get().activeWalletPublicKey !== walletPublicKeyStr) {
                state._connectWebSocket(walletPublicKey);
            }
        } catch (e: any) {
            console.error("Error in subscription process:", e);
            // set({ error: e, loading: false }); // OLD
            set({ storeError: e instanceof Error ? e : new Error(String(e)), isConnectingOrFetching: false }); // NEW
        } finally {
            set({ isConnectingOrFetching: false });
        }
    },
}));

// Initialize with empty balances or all tokens with 0 balance
useTokenBalanceStore.getState()._initializeBalances();



