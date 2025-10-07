import { useQuery } from '@tanstack/react-query';
import { JupiterTokenResponse } from '@/types/jupiter';

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
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to fetch top organic tokens with 1 minute cache
 */
export const useTopOrganicTokens = (limit: number = 20) => {
  return useQuery({
    queryKey: ['jupiterTopOrganic', limit],
    queryFn: () => fetchTopOrganicTokens(limit),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to fetch trending tokens with 1 minute cache
 */
export const useTrendingTokens = (limit: number = 20) => {
  return useQuery({
    queryKey: ['jupiterTrending', limit],
    queryFn: () => fetchTrendingTokens(limit),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
