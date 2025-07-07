import { useQuery } from '@tanstack/react-query';

export const useTokenPrice = (coingeckoId: string | undefined): {
  price: number | undefined;
  isLoading: boolean;
  error: Error | null;
} => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenPrice', coingeckoId],
    queryFn: async () => {
      if (!coingeckoId) throw new Error('No CoinGecko ID provided');
      
      const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}`;
      const options = {
        method: 'GET',
        // headers: {
        //   accept: 'application/json', 
        //   'x-cg-demo-api-key': 'CG-EzGunLz9CQhXyuzz6bRUx4b4'
        // }
      };
      
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to fetch token price');
      
      const data = await response.json();
      return data.market_data.current_price.usd;
    },
    enabled: !!coingeckoId,
    refetchInterval: 30 * 1000, // 30 seconds
  });

  return {
    price: data,
    isLoading,
    error
  };
};
