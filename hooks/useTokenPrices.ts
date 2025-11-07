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
  priceChange24h: number | undefined;
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
  const priceChange24h = tokenAddress && data?.[tokenAddress]?.priceChange24h;

  return {
    price: hasCachedPrice ? pricePerToken : jupiterPrice || undefined,
    priceChange24h: priceChange24h || undefined,
    isLoading: hasCachedPrice ? false : isLoading || assetLoading,
    error: error as Error | null,
  };
};

/**
 * Hook to fetch prices for multiple tokens from Jupiter API
 * First checks useTokenAsset for cached prices, then falls back to Jupiter API
 * @param tokenAddresses - Array of Solana token addresses
 * @returns Object mapping token addresses to their prices and price changes
 */
export const useTokenPrices = (
  tokenAddresses: string[] = [],
): {
  prices: Record<string, number>;
  priceChanges: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
} => {
  // Filter out any undefined or empty addresses
  const validAddresses = tokenAddresses.filter(Boolean);

  // Fetch from Jupiter for all addresses
  const { data, isLoading, error } = useQuery<JupiterPriceResponse>({
    queryKey: ['jupiterPrices', ...validAddresses.sort()],
    queryFn: () => getJupiterPrices(validAddresses),
    enabled: validAddresses.length > 0,
    staleTime: CACHE_TIME.TOKEN_ASSETS.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_ASSETS.GC_TIME,
    refetchInterval: CACHE_TIME.TOKEN_ASSETS.REFETCH_INTERVAL,
    retry: RETRY_CONFIG.DEFAULT_RETRIES,
    retryDelay: RETRY_CONFIG.exponentialDelay,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Extract prices and price changes from Jupiter data
  const allPrices: Record<string, number> = {};
  const priceChanges: Record<string, number> = {};

  if (data) {
    validAddresses.forEach((address) => {
      if (data[address]?.usdPrice) {
        allPrices[address] = data[address].usdPrice;
      }
      if (data[address]?.priceChange24h !== undefined) {
        priceChanges[address] = data[address].priceChange24h;
      }
    });
  }

  return {
    prices: allPrices,
    priceChanges,
    isLoading: validAddresses.length > 0 ? isLoading : false,
    error: error as Error | null,
  };
};
