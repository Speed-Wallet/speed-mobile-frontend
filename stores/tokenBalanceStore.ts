import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { create } from 'zustand';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { CONNECTION } from '@/services/walletService';
import { getAllTokenInfo } from '@/data/tokens'; // Assuming EnrichedTokenEntry is exported from tokens
import { EnrichedTokenEntry } from '@/data/types';
import { useShallow } from 'zustand/react/shallow';

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

    // Actions
    subscribeToTokenBalances: (walletPublicKeyStr: string | null) => Promise<void>;
    _initializeBalances: () => void;
    _fetchInitialBalances: (walletPublicKey: PublicKey) => Promise<void>;
    _connectWebSocket: (walletPublicKey: PublicKey) => void;
    _disconnectWebSocket: () => void;
    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => void;
}

async function fetchNativeSolBalance(walletPublicKey: PublicKey): Promise<{ address: string; balance: number; rawBalance: bigint }> {
    try {
        const lamports = await CONNECTION.getBalance(walletPublicKey);
        return {
            address: 'So11111111111111111111111111111111111111112',
            balance: lamports / LAMPORTS_PER_SOL,
            rawBalance: BigInt(lamports),
        };
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        return {
            address: 'So11111111111111111111111111111111111111112',
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
                const result = token.address === 'So11111111111111111111111111111111111111112'
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

        const rpcEndpoint = CONNECTION.rpcEndpoint.replace(/^http/, 'ws');
        const newWs = new WebSocket(rpcEndpoint);
        let currentRequestIdToMintAddress: Record<number, string> = {};

        newWs.onopen = () => {
            console.log('WebSocket connection opened for token balance subscriptions (Zustand).');
            set({ ws: newWs }); // Store the active WebSocket instance
            allTokens.forEach((token, idx) => {
                const isSol = token.address === 'So11111111111111111111111111111111111111112';
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

            if (message.result && message.id && state.requestIdToMintAddress[message.id]) {
                const mintAddress = state.requestIdToMintAddress[message.id];
                set(s => ({
                    rpcSubIdToMintAddress: { ...s.rpcSubIdToMintAddress, [message.result]: mintAddress },
                    requestIdToMintAddress: (({ [message.id]: _, ...rest }) => rest)(s.requestIdToMintAddress) // Remove handled ID
                }));
            } else if (message.method === "accountNotification") {
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
                    else if (message.params.result.value.lamports !== undefined && tokenInfo.extensions?.coingeckoId === 'solana') {
                        // Assuming SOL is a token in your list and its balance comes from lamports
                        humanBalance = message.params.result.value.lamports / (10 ** tokenInfo.decimals);
                        rawAmount = BigInt(message.params.result.value.lamports);
                    }


                    state._updateBalance(mintAddress, humanBalance, rawAmount);
                } else if (tokenInfo && message.params.result && message.params.result.value === null) { // Account closed
                    state._updateBalance(mintAddress, 0, BigInt(0));
                }
            }
        };

        newWs.onerror = (error) => {
            console.error("WebSocket error (Zustand):", error);
            // set({ error: new Error("WebSocket connection error."), ws: null, isConnectingOrFetching: false, loading: false }); // OLD
            set({ wsError: new Error("WebSocket connection error."), ws: null, isConnectingOrFetching: false }); // NEW
        };

        newWs.onclose = () => {
            console.log('WebSocket connection closed (Zustand).');
            // Avoid resetting ws to null here if a reconnect strategy is desired or if disconnect was intentional
            // For now, just mark as not connected.
            if (get().ws === newWs) { // Only update if this is the active WebSocket instance
                // set({ ws: null, isConnectingOrFetching: false }); // No loading if WS just closes // OLD
                set(state => ({ // Preserve wsError if it was set by onerror
                    ws: null,
                    isConnectingOrFetching: false,
                    // wsError: state.wsError // Keep existing wsError if any
                }));
            }
        };
    },

    _disconnectWebSocket: () => {
        const currentWs = get().ws;
        if (currentWs) {
            console.log("Closing WebSocket connection (Zustand).");
            currentWs.close();
            // set({ ws: null, rpcSubIdToMintAddress: {}, requestIdToMintAddress: {} }); // OLD
            set({ ws: null, rpcSubIdToMintAddress: {}, requestIdToMintAddress: {}, wsError: null }); // NEW, clear wsError on explicit disconnect
        }
    },

    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => {
        set(state => {
            const tokenInfo = allTokens.find(t => t.address === mintAddress);
            if (!tokenInfo) return state; 

            const existingBalanceEntry = state.tokenBalanceDetails[mintAddress]; // Renamed property

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
            // set({ activeWalletPublicKey: null, error: null, loading: false, isConnectingOrFetching: false }); // OLD
            set({ activeWalletPublicKey: null, isConnectingOrFetching: false, storeError: null, wsError: null }); // NEW
            return;
        }

        if (state.activeWalletPublicKey !== walletPublicKeyStr) {
            state._disconnectWebSocket(); // Disconnect if wallet changed
            // set({ activeWalletPublicKey: walletPublicKeyStr, balances: {}, error: null }); // OLD
            set({ activeWalletPublicKey: walletPublicKeyStr, tokenBalanceDetails: {}, storeError: null, wsError: null }); // Renamed property // NEW
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



