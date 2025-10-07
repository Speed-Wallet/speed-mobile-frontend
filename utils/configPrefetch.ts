import { QueryClient } from '@tanstack/react-query';
import { CACHE_TIME } from '@/constants/cache';

export interface AppConfig {
  platformFeeAccount: string;
  swapFeeRate: number;
  virtualCardCreationFee: number;
}

const fetchConfig = async (): Promise<AppConfig> => {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('Base backend URL not configured');
  }

  const response = await fetch(`${baseUrl}/api/config`);

  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const prefetchAppConfig = async (queryClient: QueryClient) => {
  try {
    await queryClient.prefetchQuery({
      queryKey: ['app-config'],
      queryFn: fetchConfig,
      staleTime: CACHE_TIME.CONFIG.STALE_TIME,
      gcTime: CACHE_TIME.CONFIG.GC_TIME,
    });
    console.log('App config prefetched successfully');
  } catch (error) {
    console.warn('Failed to prefetch app config:', error);
    // Don't throw - we don't want to break app initialization if config fails
  }
};
