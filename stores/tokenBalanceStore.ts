import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { CONNECTION } from '@/services/walletService';
import { getAllTokenInfo } from '@/data/tokens'; // Assuming EnrichedTokenEntry is exported from tokens
import { EnrichedTokenEntry } from '@/data/types';

// Define the shape of the balance information
export interface LiveBalanceInfo {
    balance: number; // Human-readable balance
    rawBalance: bigint;
}

// The state will be a map from mint address to TokenEntry enriched with LiveBalanceInfo
export type TokenWithLiveBalance = EnrichedTokenEntry & LiveBalanceInfo;

export interface BalancesState {
    [mintAddress: string]: TokenWithLiveBalance;
}

const allTokens = getAllTokenInfo();

interface TokenBalanceStoreState {
    balances: BalancesState;
    loading: boolean;
    error: Error | null;
    activeWalletPublicKey: string | null;
    ws: WebSocket | null;
    requestIdToMintAddress: Record<number, string>;
    rpcSubIdToMintAddress: Record<number, string>;
    isConnectingOrFetching: boolean;

    // Actions
    subscribeToTokenBalances: (walletPublicKeyStr: string | null) => Promise<void>;
    _initializeBalances: () => void;
    _fetchInitialBalances: (walletPublicKey: PublicKey) => Promise<void>;
    _connectWebSocket: (walletPublicKey: PublicKey) => void;
    _disconnectWebSocket: () => void;
    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => void;
}

const fetchTokenBalanceForStore = async (
    token: EnrichedTokenEntry,
    walletPublicKey: PublicKey
): Promise<{ address: string; balance: number; rawBalance: bigint } | null> => {
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
    balances: {},
    loading: false,
    error: null,
    activeWalletPublicKey: null,
    ws: null,
    requestIdToMintAddress: {},
    rpcSubIdToMintAddress: {},
    isConnectingOrFetching: false,

    _initializeBalances: () => {
        const initialBalances: BalancesState = {};
        allTokens.forEach(token => {
            initialBalances[token.address] = {
                ...token,
                balance: 0,
                rawBalance: BigInt(0),
            };
        });
        set({ balances: initialBalances });
    },

    _fetchInitialBalances: async (walletPublicKey: PublicKey) => {
        get()._initializeBalances(); // Set all to 0 before fetching
        set({ loading: true, error: null });

        try {
            const balancePromises = allTokens.map(token =>
                fetchTokenBalanceForStore(token, walletPublicKey)
            );
            const results = await Promise.all(balancePromises);

            set(state => {
                const newBalances = { ...state.balances };
                results.forEach(result => {
                    if (result) {
                        const tokenInfo = allTokens.find(t => t.address === result.address);
                        if (tokenInfo) {
                            newBalances[result.address] = {
                                ...tokenInfo,
                                balance: result.balance,
                                rawBalance: result.rawBalance,
                            };
                        }
                    }
                });
                return { balances: newBalances, loading: false };
            });
        } catch (e: any) {
            console.error("Error fetching initial balances:", e);
            set({ error: e, loading: false });
        }
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
                const mintPublicKey = new PublicKey(token.address);
                const ata = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey, false);
                const requestId = Date.now() + idx; // More unique request ID

                currentRequestIdToMintAddress[requestId] = token.address;

                newWs.send(
                    JSON.stringify({
                        jsonrpc: "2.0",
                        id: requestId,
                        method: "accountSubscribe",
                        params: [
                            ata.toBase58(),
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
            set({ error: new Error("WebSocket connection error."), ws: null, isConnectingOrFetching: false, loading: false });
        };

        newWs.onclose = () => {
            console.log('WebSocket connection closed (Zustand).');
            // Avoid resetting ws to null here if a reconnect strategy is desired or if disconnect was intentional
            // For now, just mark as not connected.
            if (get().ws === newWs) { // Only update if this is the active WebSocket instance
                set({ ws: null, isConnectingOrFetching: false }); // No loading if WS just closes
            }
        };
    },

    _disconnectWebSocket: () => {
        const currentWs = get().ws;
        if (currentWs) {
            console.log("Closing WebSocket connection (Zustand).");
            currentWs.close();
            set({ ws: null, rpcSubIdToMintAddress: {}, requestIdToMintAddress: {} });
        }
    },

    _updateBalance: (mintAddress: string, balance: number, rawBalance: bigint) => {
        set(state => {
            const tokenInfo = allTokens.find(t => t.address === mintAddress);
            if (!tokenInfo) return state; // Should not happen if mintAddress is from our subscriptions

            return {
                balances: {
                    ...state.balances,
                    [mintAddress]: {
                        ...(state.balances[mintAddress] || tokenInfo), // Fallback to tokenInfo if not in balances yet
                        balance,
                        rawBalance,
                    },
                },
            };
        });
    },

    subscribeToTokenBalances: async (walletPublicKeyStr: string | null) => {
        const state = get();
        alert("Subscribing to token balances for wallet: " + walletPublicKeyStr);
        if (state.isConnectingOrFetching && state.activeWalletPublicKey === walletPublicKeyStr) {
            console.log("Already connecting/fetching for this wallet.");
            return;
        }

        set({ isConnectingOrFetching: true });

        if (!walletPublicKeyStr) {
            state._disconnectWebSocket();
            state._initializeBalances(); // Reset to 0 balances
            set({ activeWalletPublicKey: null, error: null, loading: false, isConnectingOrFetching: false });
            return;
        }

        if (state.activeWalletPublicKey !== walletPublicKeyStr) {
            state._disconnectWebSocket(); // Disconnect if wallet changed
            set({ activeWalletPublicKey: walletPublicKeyStr, balances: {}, error: null }); // Reset balances for new wallet
            state._initializeBalances(); // Initialize with 0s for the new wallet
        }

        // If WebSocket is not connected, or wallet changed, fetch initial and then connect
        try {
            const walletPublicKey = new PublicKey(walletPublicKeyStr);
            await state._fetchInitialBalances(walletPublicKey); // Sets loading to false internally
            // Only connect WebSocket if not already connected for the current key
            if (!get().ws || get().activeWalletPublicKey !== walletPublicKeyStr) {
                state._connectWebSocket(walletPublicKey);
            }
        } catch (e: any) {
            console.error("Error in subscription process:", e);
            set({ error: e, loading: false });
        } finally {
            set({ isConnectingOrFetching: false });
        }
    },
}));

// Initialize with empty balances or all tokens with 0 balance
useTokenBalanceStore.getState()._initializeBalances();

