import { useState, useEffect } from 'react';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import { getAccount, AccountLayout, getAssociatedTokenAddressSync, Account as SplAccount } from '@solana/spl-token';
import { useQueries } from '@tanstack/react-query';
import { CONNECTION } from '@/services/walletService';
import { getAllTokenInfo } from '@/data/tokens';
import { EnrichedTokenEntry } from '@/data/types';


const tokens = getAllTokenInfo();

// Define the shape of the balance information we'll add
export interface LiveBalanceInfo {
  balance: number; // Human-readable balance
  rawBalance: bigint;
}

// The state will be a map from mint address to TokenEntry enriched with LiveBalanceInfo
export type TokenWithLiveBalance = EnrichedTokenEntry & LiveBalanceInfo;

export interface BalancesState {
  [mintAddress: string]: TokenWithLiveBalance;
}

// Query function for fetching a single token's balance
const fetchTokenBalanceQueryFn = async (
  token: EnrichedTokenEntry,
  walletPublicKey: PublicKey
) => {
  const mintPublicKey = new PublicKey(token.address);
  const ata = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey, false);
  try {
    const accountInfo = await getAccount(CONNECTION, ata);
    return {
      address: token.address, // Include address to map back easily
      balance: Number(accountInfo.amount) / (10 ** token.decimals),
      rawBalance: accountInfo.amount,
    };
  } catch (e: any) {
    // If ATA not found, balance is 0. This is considered data, not an error for the query.
    if (e.name === 'TokenAccountNotFoundError' || e.message?.includes('could not find account')) {
      return {
        address: token.address,
        balance: 0,
        rawBalance: BigInt(0),
      };
    }
    throw e; // Re-throw other errors for useQuery to handle
  }
};

const useTokenBalances = (walletPublicKeyStr: string | null) => {
  const [balances, setBalances] = useState<BalancesState>({});
  const [overallLoading, setOverallLoading] = useState<boolean>(true);
  const [overallError, setOverallError] = useState<Error | null>(null);

  const walletPublicKey = walletPublicKeyStr ? new PublicKey(walletPublicKeyStr) : null;

  // Prepare queries for useQueries
  const queries = tokens.map(token => ({
    queryKey: ['tokenBalance', walletPublicKeyStr, token.address],
    queryFn: () => fetchTokenBalanceQueryFn(token, walletPublicKey!), // walletPublicKey is asserted non-null due to `enabled`
    enabled: !!walletPublicKey, // Only run queries if walletPublicKey is available
  }));

  const results = useQueries({ queries });

  // Effect to update balances state from query results
  useEffect(() => {
    if (!walletPublicKeyStr) {
      setBalances({});
      setOverallLoading(false);
      setOverallError(null);
      return;
    }

    const newBalancesState: BalancesState = {};
    let anyQueryLoading = false;
    let firstQueryError: Error | null = null;

    tokens.forEach((token, index) => {
      const result = results[index];
      
      if (result.isLoading) {
        anyQueryLoading = true;
      }
      if (result.isError && !firstQueryError) {
        firstQueryError = result.error as Error;
      }

      if (result.data) {
        newBalancesState[token.address] = {
          ...token,
          balance: result.data.balance,
          rawBalance: result.data.rawBalance,
        };
      } else {
        // Initialize with 0 balance if no data yet (loading, error, or not enabled)
        newBalancesState[token.address] = {
          ...token,
          balance: 0,
          rawBalance: BigInt(0),
        };
      }
    });

    setBalances(newBalancesState);
    setOverallLoading(anyQueryLoading);
    // Set overallError based on query errors. Subscription errors are handled in their effect.
    // This means query errors can overwrite subscription errors and vice-versa.
    setOverallError(firstQueryError); 

  }, [results, walletPublicKeyStr]); // `tokens` is module-scoped constant, not strictly needed in deps.

  // Effect for subscriptions
  useEffect(() => {
    if (!walletPublicKeyStr) {
      // Cleanup and state reset for disconnected wallet is handled by the effect above.
      return () => {}; // No subscriptions to clear
    }

    // Ensure PublicKey is created for this effect's scope if walletPublicKeyStr is valid
    const currentWalletPublicKey = new PublicKey(walletPublicKeyStr);
    const subscriptionIds: number[] = [];

    // This effect now only sets up subscriptions. Initial balances are handled by useQueries.
    // No initial loading state management here for fetching, as useQueries handles it.
    try {
      for (const token of tokens) {
        const mintPublicKey = new PublicKey(token.address);
        const ata = getAssociatedTokenAddressSync(mintPublicKey, currentWalletPublicKey, false);

        const subId = CONNECTION.onAccountChange(
          ata,
          (updatedAccountInfo: AccountInfo<Buffer> | null /*, context */) => {
            if (updatedAccountInfo) {
              try {
                const decodedAccountInfo = AccountLayout.decode(updatedAccountInfo.data);
                const rawAmount = BigInt(decodedAccountInfo.amount.toString()); 
                const humanBalance = Number(rawAmount) / (10 ** token.decimals);

                setBalances(prevBalances => ({
                  ...prevBalances,
                  [token.address]: {
                    ...(prevBalances[token.address] || token), 
                    balance: humanBalance,
                    rawBalance: rawAmount,
                  },
                }));
              } catch (e) {
                console.error(`Error processing account change for ${token.symbol}:`, e);
              }
            } else {
              // Account was likely closed, set balance to 0
              setBalances(prevBalances => ({
                ...prevBalances,
                [token.address]: {
                  ...(prevBalances[token.address] || token),
                  balance: 0,
                  rawBalance: BigInt(0),
                },
              }));
            }
          },
          "confirmed"
        );
        subscriptionIds.push(subId);
      }
    } catch (e) {
      console.error("Error setting up subscriptions:", e);
      // If subscription setup fails, reflect this error.
      // This might be overwritten by query errors/success in the other effect or vice-versa.
      setOverallError(e as Error); 
    }
    // No setLoading(false) here, as loading is tied to useQueries for initial data.

    return () => {
      subscriptionIds.forEach(id => {
        CONNECTION.removeAccountChangeListener(id)
          .catch(e => console.error("Error unsubscribing from account change listener:", e));
      });
    };
  }, [walletPublicKeyStr]); // `tokens` is module-scoped constant.

  return { balances, loading: overallLoading, error: overallError };
};

export default useTokenBalances;
