/**
 * Token addresses for Solana mainnet
 * Centralized location for all token contract addresses used throughout the app
 */
export const TOKEN_ADDRESSES = {
  // USDT (Tether USD) - SPL Token
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',

  // USDC (USD Coin) - SPL Token
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',

  // SOL (Native Solana token)
  SOL: 'So11111111111111111111111111111111111111112',

  // Wrapped SOL (WSOL)
  WSOL: 'So11111111111111111111111111111111111111112',
} as const;

// Export individual token addresses for convenience
export const USDT_ADDRESS = TOKEN_ADDRESSES.USDT;
export const USDC_ADDRESS = TOKEN_ADDRESSES.USDC;
export const SOL_ADDRESS = TOKEN_ADDRESSES.SOL;
export const WSOL_ADDRESS = TOKEN_ADDRESSES.WSOL;

/**
 * Token metadata constants
 */
export const TOKEN_DECIMALS = {
  USDT: 6,
  USDC: 6,
  SOL: 9,
  WSOL: 9,
} as const;

export const TOKEN_SYMBOLS = {
  [TOKEN_ADDRESSES.USDT]: 'USDT',
  [TOKEN_ADDRESSES.USDC]: 'USDC',
  [TOKEN_ADDRESSES.SOL]: 'SOL', // SOL and WSOL have the same address
} as const;
