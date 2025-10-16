import { useTokenAsset } from './useTokenAsset';

/**
 * Hook to get token balance for a specific token address
 * Wrapper around useTokenAsset that returns only balance-related data
 */
export const useTokenBalance = (tokenAddress: string | null | undefined) => {
  const { balance, loading, error, refetch } = useTokenAsset(tokenAddress);

  return {
    balance,
    isLoading: loading,
    error,
    refetch,
  };
};
