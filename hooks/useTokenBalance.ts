import { useShallow } from 'zustand/react/shallow';
import { useTokenBalanceStore, TokenBalanceDetails } from '../stores/tokenBalanceStore';

interface UseTokenBalanceResult {
    balance: number; // Human-readable balance
    rawBalance: bigint; // Raw balance in the smallest unit (e.g., lamports for SOL)
    decimals: number; // Number of decimals for the token
    loading: boolean; // Optional loading state for the specific token
    //   wsError: Error | null; // WebSocket specific errors from the store
    //   storeError: Error | null; // General store operation errors
    error: Error | null; // General store operation errors
    globalError: Error | null; // Combined WebSocket and store errors
    isConnectingOrFetchingOverall: boolean; // Overall status of fetching/connecting
}

/**
 * Custom hook to get the detailed balance, loading state, and error state for a single token,
 * along with any global WebSocket or store errors.
 * @param address The mint address of the token. Can be undefined if no specific token is targeted yet.
 * @returns An object containing tokenDetails (balance, loading, error for the specific token),
 *          wsError, storeError, and isConnectingOrFetching status from the store.
 */
export const useTokenBalance = (address: string | undefined): UseTokenBalanceResult => {
    const { tokenBalanceDetails, wsError, storeError, isConnectingOrFetchingOverall } = useTokenBalanceStore(
        useShallow((state) => ({
            tokenBalanceDetails: state.tokenBalanceDetails,
            wsError: state.wsError,
            storeError: state.storeError,
            isConnectingOrFetchingOverall: state.isConnectingOrFetching, // Renamed to avoid conflict in return object
        }))
    );

    const tokenDetails = address ? tokenBalanceDetails[address] : undefined;

    return {
        balance: tokenDetails?.balance || 0,
        rawBalance: tokenDetails?.rawBalance || BigInt(0),
        decimals: tokenDetails?.decimals || 0,
        loading: tokenDetails?.loading || false,
        error: tokenDetails?.error || null,
        globalError: storeError || wsError || null, // Combine WebSocket and store errors
        isConnectingOrFetchingOverall: isConnectingOrFetchingOverall,
    };
};
