import { useQuery } from '@tanstack/react-query';

export interface TokenPrice {
  id: string;
  price: number;
}

// Batch fetch prices for multiple tokens - more efficient and prevents hooks in loops
export const useTokenPrices = (coingeckoIds: string[] = []): {
  prices: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
} => {
  // Filter out any undefined or empty IDs
  const validIds = coingeckoIds.filter(Boolean);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrices', validIds.sort().join(',')],
    queryFn: async () => {
      if (!validIds.length) return {};
      
      try {
        // Use your backend endpoint which batches all token prices
        const baseUrl = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
        if (!baseUrl) {
          throw new Error('Backend URL not configured');
        }
        
        const response = await fetch(`${baseUrl}/token-prices`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const result = await response.json();
        
        // Transform the response to a simple coingeckoId -> price mapping
        const prices: Record<string, number> = {};
        if (result.success && result.data) {
          result.data.forEach((token: any) => {
            if (token.coingeckoId && token.priceData?.current_price) {
              prices[token.coingeckoId] = token.priceData.current_price;
            }
          });
        }
        
        return prices;
      } catch (apiError) {
        console.warn('Backend API not available, falling back to CoinGecko direct:', apiError);
        
        // Fallback to CoinGecko direct (for development)
        const ids = validIds.join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch token prices from CoinGecko');
        }
        
        const data = await response.json();
        
        // Transform CoinGecko response to our format
        const prices: Record<string, number> = {};
        Object.entries(data).forEach(([id, priceData]: [string, any]) => {
          if (priceData?.usd) {
            prices[id] = priceData.usd;
          }
        });
        
        return prices;
      }
    },
    enabled: validIds.length > 0,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  return {
    prices: data || {},
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
