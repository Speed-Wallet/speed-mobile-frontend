import { AuthService } from './authService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

// Types for token asset API
export interface TokenAsset {
  address: string; // Mint address
  symbol: string;
  name: string;
  logoURI: string;
  balance: number; // Human-readable balance
  rawBalance: string; // Raw balance as string to avoid precision issues
  decimals: number;
  mint: string;
  tokenStandard: string;
  // Price information
  totalPrice: number; // Total value in USD
  pricePerToken: number; // Price per single token
  currency: string; // Currency for pricing (usually USD/USDC)
  // Optional fields (not present for native SOL)
  supply?: string;
  tokenProgram?: string;
  associatedTokenAddress?: string;
}

export interface GetTokenBalancesRequest {
  walletAddress: string;
}

export interface GetTokenBalancesResponse {
  success: boolean;
  data?: {
    walletAddress: string;
    tokenBalances: TokenAsset[];
    total: number;
    timestamp: number;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch token balances for a wallet address
 */
export const getTokenBalances = async (
  walletAddress: string,
): Promise<GetTokenBalancesResponse> => {
  try {
    if (!BASE_BACKEND_URL) {
      throw new Error('Backend URL not configured');
    }

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const authHeaders = await AuthService.getAuthHeader();

    const response = await fetch(`${BASE_BACKEND_URL}/api/wallet/balances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        walletAddress,
      }),
    });

    if (!response.ok) {
      console.log('error response', await response.json());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetTokenBalancesResponse = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || data.message || 'Failed to fetch token balances',
      );
    }

    return data;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Convert raw balance to human-readable balance
 */
export const formatTokenBalance = (
  rawBalance: string | bigint,
  decimals: number,
): number => {
  const balance =
    typeof rawBalance === 'string' ? BigInt(rawBalance) : rawBalance;
  return Number(balance) / Math.pow(10, decimals);
};

/**
 * Convert human-readable balance to raw balance
 */
export const parseTokenBalance = (
  balance: number,
  decimals: number,
): bigint => {
  return BigInt(Math.floor(balance * Math.pow(10, decimals)));
};
