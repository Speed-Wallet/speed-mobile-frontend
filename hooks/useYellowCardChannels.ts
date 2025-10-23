/**
 * TanStack Query hook for YellowCard channels
 */

import { useQuery } from '@tanstack/react-query';
import {
  getActiveChannels,
  getActiveDepositChannels,
  type YellowCardChannel,
} from '@/services/yellowcardApi';
import { CACHE_TIME, RETRY_CONFIG } from '@/constants/cache';

export function useActiveYellowCardChannels() {
  return useQuery({
    queryKey: ['yellowcard', 'channels', 'active'],
    queryFn: getActiveChannels,
    staleTime: CACHE_TIME.YELLOWCARD_CHANNELS.STALE_TIME,
    gcTime: CACHE_TIME.YELLOWCARD_CHANNELS.GC_TIME,
    refetchInterval: CACHE_TIME.YELLOWCARD_CHANNELS.REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    retry: RETRY_CONFIG.DEFAULT_RETRIES,
  });
}

/**
 * Hook to get available payment methods for a specific country
 */
export function useCountryPaymentMethods(
  countryCode?: string,
  currency?: string,
) {
  const { data, isLoading, error } = useActiveYellowCardChannels();

  if (!data || !countryCode || !currency) {
    return {
      channels: [],
      paymentMethods: [],
      isLoading,
      error,
    };
  }

  const activeChannels = getActiveDepositChannels(
    data.channels,
    countryCode,
    currency,
  );

  // Extract unique payment method types
  const paymentMethods = Array.from(
    new Set(activeChannels.map((channel) => channel.channelType)),
  );

  return {
    channels: activeChannels,
    paymentMethods,
    isLoading,
    error,
  };
}
