import { AuthService } from './authService';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

// Types for token metadata
export interface TokenMetadata {
  address: string; // Mint address
  name: string;
  symbol: string;
  logoURI: string;
  decimals: number;
  decimalsShown?: number; // How many decimals to show in UI
}

// Types for token asset API
export interface TokenAsset extends TokenMetadata {
  balance: number; // Human-readable balance
  rawBalance: string; // Raw balance as string to avoid precision issues
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

export interface GetTokenAssetsRequest {
  walletAddress: string;
}

export interface GetTokenAssetsResponse {
  success: boolean;
  data?: {
    walletAddress: string;
    tokenAssets: TokenAsset[];
    total: number;
    timestamp: number;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch token assets for a wallet address
 */
export const getTokenAssets = async (
  walletAddress: string,
): Promise<GetTokenAssetsResponse> => {
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

    const data: GetTokenAssetsResponse = await response.json();

    if (!data.success) {
      throw new Error(
        data.error || data.message || 'Failed to fetch token assets',
      );
    }

    return data;
  } catch (error) {
    console.error('Error fetching token assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Convert raw balance to human-readable balance
 */
export const formatTokenAsset = (
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
export const parseTokenAsset = (balance: number, decimals: number): bigint => {
  return BigInt(Math.floor(balance * Math.pow(10, decimals)));
};
