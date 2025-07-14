import { useQuery } from '@tanstack/react-query';
import { getTokenPrices } from '@/services/apis';

export interface TokenPrice {
  id: string;
  price: number;
}

// Global query that fetches ALL token prices once
const useAllTokenPrices = () => {
  return useQuery({
    queryKey: ['allTokenPrices'], // Single cache key for all tokens
    queryFn: async () => {
      try {
        const result = await getTokenPrices();
        
        // Transform the response to a simple coingeckoId -> price mapping
        const prices: Record<string, number> = {};
        if (result.success && result.data) {
          result.data.forEach((token) => {
            if (token.coingeckoId && token.priceData?.current_price) {
              prices[token.coingeckoId] = token.priceData.current_price;
            }
          });
        }
        
        return prices;
      } catch (apiError) {
        console.error('Backend API error:', apiError);
        throw apiError;
      }
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
};

// Batch fetch prices for multiple tokens - now just filters from global cache
export const useTokenPrices = (coingeckoIds: string[] = []): {
  prices: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
} => {
  // Filter out any undefined or empty IDs
  const validIds = coingeckoIds.filter(Boolean);
  
  // Use the global query that fetches all prices
  const { data: allPrices, isLoading, error } = useAllTokenPrices();
  
  // Filter the results to only include requested tokens
  const filteredPrices: Record<string, number> = {};
  if (allPrices && validIds.length > 0) {
    validIds.forEach(id => {
      if (allPrices[id] !== undefined) {
        filteredPrices[id] = allPrices[id];
      }
    });
  }

  return {
    prices: validIds.length > 0 ? filteredPrices : (allPrices || {}),
    isLoading,
    error
  };
};

// Single token price hook (backwards compatible) - now just a wrapper
export const useTokenPrice = (coingeckoId: string | undefined): {
  price: number | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const { prices, isLoading, error } = useTokenPrices(coingeckoId ? [coingeckoId] : []);
  
  return {
    price: coingeckoId ? prices[coingeckoId] : undefined,
    isLoading,
    error
  };
};
