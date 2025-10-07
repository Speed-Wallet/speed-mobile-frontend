import { useQuery } from '@tanstack/react-query';
import { CACHE_TIME, RETRY_CONFIG } from '@/constants/cache';

export interface AppConfig {
  platformFeeAccount: string;
  swapFeeRate: number;
  virtualCardCreationFee: number;
  cashwyreBaseFee: number;
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

export const useConfig = () => {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: fetchConfig,
    staleTime: CACHE_TIME.CONFIG.STALE_TIME,
    gcTime: CACHE_TIME.CONFIG.GC_TIME,
    retry: RETRY_CONFIG.DEFAULT_RETRIES,
    retryDelay: RETRY_CONFIG.longExponentialDelay,
  });
};

// Hook for accessing individual config values with fallbacks
export const useConfigValue = <K extends keyof AppConfig>(
  key: K,
  fallback?: AppConfig[K],
): AppConfig[K] | undefined => {
  const { data } = useConfig();
  return data?.[key] ?? fallback;
};
