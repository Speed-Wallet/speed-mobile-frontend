import { useQuery, useQueryClient } from '@tanstack/react-query';
import { JupiterTokenResponse, JupiterToken } from '@/types/jupiter';
import { CACHE_TIME } from '@/constants/cache';

const JUPITER_API_BASE = 'https://lite-api.jup.ag/tokens/v2';

/**
 * Fetch top traded tokens
 */
export const fetchTopTradedTokens = async (
  limit: number = 20,
): Promise<JupiterTokenResponse> => {
  const response = await fetch(
    `${JUPITER_API_BASE}/toptraded/24h?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top traded tokens: ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch top tokens by organic score
 */
export const fetchTopOrganicTokens = async (
  limit: number = 20,
): Promise<JupiterTokenResponse> => {
  const response = await fetch(
    `${JUPITER_API_BASE}/toporganicscore/24h?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top organic tokens: ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch trending tokens
 */
export const fetchTrendingTokens = async (
  limit: number = 20,
): Promise<JupiterTokenResponse> => {
  const response = await fetch(
    `${JUPITER_API_BASE}/toptrending/24h?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch trending tokens: ${response.status}`);
  }

  return response.json();
};

/**
 * Hook to fetch top traded tokens with 1 minute cache
 */
export const useTopTradedTokens = (limit: number = 20) => {
  return useQuery({
    queryKey: ['jupiterTopTraded', limit],
    queryFn: () => fetchTopTradedTokens(limit),
    staleTime: CACHE_TIME.JUPITER.STALE_TIME,
    gcTime: CACHE_TIME.JUPITER.GC_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to fetch top organic tokens with 1 minute cache
 */
// export const useTopOrganicTokens = (limit: number = 20) => {
//   return useQuery({
//     queryKey: ['jupiterTopOrganic', limit],
//     queryFn: () => fetchTopOrganicTokens(limit),
//     staleTime: CACHE_TIME.JUPITER.STALE_TIME,
//     gcTime: CACHE_TIME.JUPITER.GC_TIME,
//     refetchOnWindowFocus: true,
//     refetchOnReconnect: true,
//   });
// };

/**
 * Hook to fetch trending tokens with 1 minute cache
 */
export const useTrendingTokens = (limit: number = 20) => {
  return useQuery({
    queryKey: ['jupiterTrending', limit],
    queryFn: () => fetchTrendingTokens(limit),
    staleTime: CACHE_TIME.JUPITER.STALE_TIME,
    gcTime: CACHE_TIME.JUPITER.GC_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Fetch tokens by search query (mint address, symbol, or name)
 * Returns all matching tokens from Jupiter API
 */
export const fetchJupiterTokens = async (
  query: string,
): Promise<JupiterTokenResponse> => {
  const response = await fetch(
    `${JUPITER_API_BASE}/search?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch a single token by mint address
 * Throws an error if more than one result is returned (should not happen for mint address queries)
 */
export const fetchJupiterToken = async (
  mintAddress: string,
): Promise<JupiterToken | null> => {
  const results = await fetchJupiterTokens(mintAddress);

  if (results.length === 0) {
    return null;
  }

  if (results.length > 1) {
    throw new Error(
      `Expected exactly one token for mint address ${mintAddress}, but got ${results.length} results`,
    );
  }

  return results[0];
};

/**
 * Hook to fetch a single token, checking cache from useTopTradedTokens and useTrendingTokens first
 * @param query - Token mint address or symbol to search for
 * @param enabled - Whether the query should run (default: true)
 */
export const useJupiterToken = (query: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['jupiterToken', query],
    queryFn: async () => {
      // Check if we have FRESH (non-stale) cached data from top traded tokens
      const topTradedState = queryClient.getQueryState<JupiterTokenResponse>([
        'jupiterTopTraded',
        20,
      ]);

      // Check if we have FRESH (non-stale) cached data from trending tokens
      const trendingState = queryClient.getQueryState<JupiterTokenResponse>([
        'jupiterTrending',
        20,
      ]);

      // Helper to check if query data is fresh (not stale)
      const isFresh = (state: any) => {
        if (!state || !state.data) return false;
        const now = Date.now();
        const dataUpdatedAt = state.dataUpdatedAt;
        const staleTime = CACHE_TIME.JUPITER.STALE_TIME;
        return now - dataUpdatedAt < staleTime;
      };

      // Search through cached data (case-insensitive)
      const searchInCache = (tokens: JupiterTokenResponse | undefined) => {
        if (!tokens) return null;

        const lowerQuery = query.toLowerCase();
        return tokens.find(
          (token) =>
            token.id.toLowerCase() === lowerQuery ||
            token.symbol.toLowerCase() === lowerQuery ||
            token.name.toLowerCase() === lowerQuery,
        );
      };

      let cachedToken: JupiterToken | null | undefined = null;

      // Try to find in top traded cache if it's fresh
      if (isFresh(topTradedState) && topTradedState?.data) {
        cachedToken = searchInCache(topTradedState.data);
      }

      // If not found and trending data is fresh, try trending cache
      if (!cachedToken && isFresh(trendingState) && trendingState?.data) {
        cachedToken = searchInCache(trendingState.data);
      }

      // If found in fresh cache, return it
      if (cachedToken) {
        return cachedToken;
      }

      // Otherwise, fetch from API
      return fetchJupiterToken(query);
    },
    staleTime: CACHE_TIME.JUPITER.STALE_TIME,
    gcTime: CACHE_TIME.JUPITER.GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: enabled && !!query,
  });
};
