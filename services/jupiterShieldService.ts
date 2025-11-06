import { useQuery } from '@tanstack/react-query';

const JUPITER_SHIELD_API_BASE = 'https://lite-api.jup.ag/ultra/v1';

export type ShieldWarningType =
  | 'NOT_VERIFIED'
  | 'LOW_LIQUIDITY'
  | 'NOT_SELLABLE'
  | 'LOW_ORGANIC_ACTIVITY'
  | 'HAS_MINT_AUTHORITY'
  | 'HAS_FREEZE_AUTHORITY'
  | 'HAS_PERMANENT_DELEGATE'
  | 'NEW_LISTING'
  | 'VERY_LOW_TRADING_ACTIVITY'
  | 'HIGH_SUPPLY_CONCENTRATION'
  | 'NON_TRANSFERABLE'
  | 'MUTABLE_TRANSFER_FEES'
  | 'SUSPICIOUS_DEV_ACTIVITY'
  | 'SUSPICIOUS_TOP_HOLDER_ACTIVITY'
  | 'HIGH_SINGLE_OWNERSHIP';

export type ShieldSeverity = 'info' | 'warning' | 'critical';

export interface ShieldWarning {
  type: ShieldWarningType;
  message: string;
  severity: ShieldSeverity;
  source?: 'RugCheck';
}

export interface ShieldResponse {
  warnings: {
    [mintAddress: string]: ShieldWarning[];
  };
}

/**
 * Warning types that should show the red exclamation mark
 */
export const CRITICAL_WARNING_TYPES: ShieldWarningType[] = [
  'NOT_VERIFIED',
  'LOW_ORGANIC_ACTIVITY',
  'LOW_LIQUIDITY',
  'NOT_SELLABLE',
  'VERY_LOW_TRADING_ACTIVITY',
  'SUSPICIOUS_DEV_ACTIVITY',
  'HAS_PERMANENT_DELEGATE',
];

/**
 * Check if a token has critical warnings
 */
export const hasCriticalWarnings = (warnings: ShieldWarning[]): boolean => {
  return warnings.some((warning) =>
    CRITICAL_WARNING_TYPES.includes(warning.type),
  );
};

/**
 * Fetch shield information for multiple token mints
 */
export const fetchShieldInfo = async (
  mints: string[],
): Promise<ShieldResponse> => {
  if (mints.length === 0) {
    return { warnings: {} };
  }

  const mintsParam = mints.join(',');
  const response = await fetch(
    `${JUPITER_SHIELD_API_BASE}/shield?mints=${mintsParam}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch shield info: ${response.status}`);
  }

  return response.json();
};

/**
 * Hook to fetch shield information with 30-second cache
 */
export const useShieldInfo = (mints: string[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ['jupiterShield', mints.sort().join(',')],
    queryFn: () => fetchShieldInfo(mints),
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    enabled: enabled && mints.length > 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
