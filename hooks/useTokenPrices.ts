import { useQuery } from '@tanstack/react-query';
import { getTokenMarketData } from '@/services/apis';
import { CACHE_TIME } from '@/constants/cache';
import { useTokenAsset } from '@/hooks/useTokenAsset';

/**
 * Hook to fetch token price from Birdeye API for a single token
 * First checks useTokenAsset for cached price, then falls back to Birdeye API
 * @param tokenAddress - Solana token address (not CoinGecko ID)
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrice', tokenAddress],
    queryFn: async () => {
      if (!tokenAddress) {
        throw new Error('Token address is required');
      }

      const result = await getTokenMarketData(tokenAddress);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch token price');
      }

      return result.data;
    },
    enabled: !!tokenAddress && !hasCachedPrice, // Only fetch if no cached price
    staleTime: CACHE_TIME.TOKEN_PRICES.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_PRICES.GC_TIME,
    refetchInterval: CACHE_TIME.TOKEN_PRICES.REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Prefer cached price from token assets, fallback to Birdeye API
  return {
    price: hasCachedPrice ? pricePerToken : data?.price,
    isLoading: hasCachedPrice ? false : isLoading || assetLoading,
    error: error as Error | null,
  };
};

/**
 * Hook to fetch prices for multiple tokens from Birdeye API
 * First checks useTokenAsset for cached prices, then falls back to Birdeye API
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

  // Only fetch from Birdeye for addresses without cached prices
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrices', ...addressesNeedingFetch.sort()],
    queryFn: async () => {
      const results = await Promise.allSettled(
        addressesNeedingFetch.map(async (address) => {
          const result = await getTokenMarketData(address);
          if (result.success && result.data) {
            return { address, price: result.data.price };
          }
          return null;
        }),
      );

      const prices: Record<string, number> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          prices[result.value.address] = result.value.price;
        }
      });

      return prices;
    },
    enabled: addressesNeedingFetch.length > 0,
    staleTime: CACHE_TIME.TOKEN_PRICES.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_PRICES.GC_TIME,
    refetchInterval: CACHE_TIME.TOKEN_PRICES.REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Combine cached prices with fetched prices
  const allPrices = {
    ...cachedPrices,
    ...(data || {}),
  };

  return {
    prices: allPrices,
    isLoading: addressesNeedingFetch.length > 0 ? isLoading : false,
    error: error as Error | null,
  };
};
