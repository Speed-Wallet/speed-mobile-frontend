import { useQuery } from '@tanstack/react-query';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
