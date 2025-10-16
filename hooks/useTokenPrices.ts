import { useQuery } from '@tanstack/react-query';
import {
  getJupiterPrices,
  JupiterPriceResponse,
} from '@/services/jupiterPriceService';
import { CACHE_TIME, RETRY_CONFIG } from '@/constants/cache';
import { useTokenAsset } from '@/hooks/useTokenAsset';

/**
 * Hook to fetch token price from Jupiter API for a single token
 * First checks useTokenAsset for cached price, then falls back to Jupiter API
 * @param tokenAddress - Solana token address
 * @returns Token price data with loading and error states
 */
export const useTokenPrice = (
  tokenAddress: string | undefined,
): {
  price: number | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  // First check if we have price data from token assets (already cached)
  const { pricePerToken, loading: assetLoading } = useTokenAsset(tokenAddress);

  // If we have a price from token assets, use it immediately
  const hasCachedPrice = pricePerToken !== undefined && pricePerToken > 0;

  const { data, isLoading, error } = useQuery<JupiterPriceResponse>({
    queryKey: ['jupiterPrice', tokenAddress],
    queryFn: async () => {
      if (!tokenAddress) {
        throw new Error('Token address is required');
      }

      return await getJupiterPrices([tokenAddress]);
    },
    enabled: !!tokenAddress && !hasCachedPrice, // Only fetch if no cached price
    staleTime: CACHE_TIME.TOKEN_ASSETS.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_ASSETS.GC_TIME,
    refetchInterval: CACHE_TIME.TOKEN_ASSETS.REFETCH_INTERVAL,
    retry: RETRY_CONFIG.DEFAULT_RETRIES,
    retryDelay: RETRY_CONFIG.exponentialDelay,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Prefer cached price from token assets, fallback to Jupiter API
  const jupiterPrice = tokenAddress && data?.[tokenAddress]?.usdPrice;

  return {
    price: hasCachedPrice ? pricePerToken : jupiterPrice || undefined,
    isLoading: hasCachedPrice ? false : isLoading || assetLoading,
    error: error as Error | null,
  };
};

/**
 * Hook to fetch prices for multiple tokens from Jupiter API
 * First checks useTokenAsset for cached prices, then falls back to Jupiter API
 * @param tokenAddresses - Array of Solana token addresses
 * @returns Object mapping token addresses to their prices
 */
export const useTokenPrices = (
  tokenAddresses: string[] = [],
): {
  prices: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
} => {
  // Filter out any undefined or empty addresses
  const validAddresses = tokenAddresses.filter(Boolean);

  // Check token assets for cached prices
  // Note: This creates multiple hook calls, but they use the same cached query
  const cachedPrices: Record<string, number> = {};
  const addressesNeedingFetch: string[] = [];

  validAddresses.forEach((address) => {
    const { pricePerToken } = useTokenAsset(address);
    if (pricePerToken !== undefined && pricePerToken > 0) {
      cachedPrices[address] = pricePerToken;
    } else {
      addressesNeedingFetch.push(address);
    }
  });

  // Only fetch from Jupiter for addresses without cached prices
  const { data, isLoading, error } = useQuery<JupiterPriceResponse>({
    queryKey: ['jupiterPrices', ...addressesNeedingFetch.sort()],
    queryFn: () => getJupiterPrices(addressesNeedingFetch),
    enabled: addressesNeedingFetch.length > 0,
    staleTime: CACHE_TIME.TOKEN_ASSETS.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_ASSETS.GC_TIME,
    refetchInterval: CACHE_TIME.TOKEN_ASSETS.REFETCH_INTERVAL,
    retry: RETRY_CONFIG.DEFAULT_RETRIES,
    retryDelay: RETRY_CONFIG.exponentialDelay,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Combine cached prices with fetched prices from Jupiter
  const allPrices: Record<string, number> = { ...cachedPrices };

  if (data) {
    addressesNeedingFetch.forEach((address) => {
      if (data[address]?.usdPrice) {
        allPrices[address] = data[address].usdPrice;
      }
    });
  }

  return {
    prices: allPrices,
    isLoading: addressesNeedingFetch.length > 0 ? isLoading : false,
    error: error as Error | null,
  };
};
