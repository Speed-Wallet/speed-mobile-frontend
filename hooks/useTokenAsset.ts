import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { useState, useEffect } from 'react';
import {
  getTokenBalances,
  type TokenAsset,
} from '@/services/tokenBalanceService';
import { useWalletPublicKey } from '@/services/walletService';

// Refetch interval in milliseconds (30 seconds)
const REFETCH_INTERVAL = 30 * 1000;

/**
 * Hook to track if app is active/inactive for controlling refetch
 */
const useAppIsActive = () => {
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState === 'active',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppIsActive(nextAppState === 'active');
    });

    return () => subscription?.remove();
  }, []);

  return appIsActive;
};

/**
 * Main hook for fetching all token assets (balances + prices + metadata)
 * Automatically polls every 30 seconds when app is active
 */
export const useTokenAssets = (walletAddress: string | null | undefined) => {
  const appIsActive = useAppIsActive();

  return useQuery({
    queryKey: ['tokenBalances', walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const response = await getTokenBalances(walletAddress);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch token balances');
      }

      return response.data;
    },
    enabled: !!walletAddress && appIsActive,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL, // Keep data fresh for the full refetch interval
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to get a specific token asset (balance + price + metadata)
 * Automatically gets the current wallet address and polls every 30 seconds when app is active
 */
export const useTokenAsset = (tokenAddress: string | null | undefined) => {
  const walletAddress = useWalletPublicKey();
  const { data, isLoading, error, refetch } = useTokenAssets(walletAddress);

  const tokenBalance = data?.tokenBalances?.find(
    (token) => token.address === tokenAddress,
  );

  const ataExists = !!tokenBalance; // exists even if balance === 0

  return {
    balance: tokenBalance?.balance || 0,
    rawBalance: tokenBalance ? BigInt(tokenBalance.rawBalance) : BigInt(0),
    decimals: tokenBalance?.decimals || 0,
    symbol: tokenBalance?.symbol || '',
    name: tokenBalance?.name || '',
    logoURI: tokenBalance?.logoURI || '',
    address: tokenBalance?.address || '',
    totalPrice: tokenBalance?.totalPrice || 0,
    pricePerToken: tokenBalance?.pricePerToken || 0,
    currency: tokenBalance?.currency || 'USD',
    ataExists,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};

/**
 * Hook to manually trigger refetch after transactions
 * Automatically uses the current wallet address
 */
export const useRefetchTokenAssets = () => {
  const queryClient = useQueryClient();
  const walletAddress = useWalletPublicKey();

  return () => {
    if (walletAddress) {
      queryClient.invalidateQueries({
        queryKey: ['tokenBalances', walletAddress],
      });
    }
  };
};
