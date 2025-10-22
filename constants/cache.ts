/**
 * Central cache configuration for TanStack Query
 * All cache times are in milliseconds
 */

// ============================================================
// CACHE DURATION CONSTANTS
// ============================================================

/**
 * Token-related cache times
 */
export const CACHE_TIME = {
  // Token prices from Birdeye API
  TOKEN_PRICES: {
    STALE_TIME: 30 * 1000, // 30 seconds - how long data is considered fresh
    GC_TIME: 5 * 60 * 1000, // 5 minutes - how long to keep in cache after unused
    REFETCH_INTERVAL: 30 * 1000, // 30 seconds - automatic refetch interval
  },

  // Token assets (balances + prices + metadata)
  TOKEN_ASSETS: {
    STALE_TIME: 30 * 1000, // 30 seconds
    GC_TIME: 5 * 60 * 1000, // 5 minutes
    REFETCH_INTERVAL: 30 * 1000, // 30 seconds
  },

  // Card data
  CARDS: {
    STALE_TIME: 30 * 1000, // 30 seconds
    GC_TIME: 5 * 60 * 1000, // 5 minutes
    REFETCH_INTERVAL: 30 * 1000, // 30 seconds
  },

  // App configuration
  CONFIG: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutes
    GC_TIME: 10 * 60 * 1000, // 10 minutes
  },

  // Jupiter API data (top traded, organic, trending tokens)
  JUPITER: {
    STALE_TIME: 60 * 1000, // 1 minute
    GC_TIME: 5 * 60 * 1000, // 5 minutes
  },

  // YellowCard payment channels
  YELLOWCARD_CHANNELS: {
    STALE_TIME: 60 * 1000, // 1 minute
    GC_TIME: 5 * 60 * 1000, // 5 minutes
    REFETCH_INTERVAL: 60 * 1000, // 1 minute - automatic refetch interval
  },
} as const;

// ============================================================
// TRANSACTION CONFIGURATION
// ============================================================

/**
 * Transaction-related timeouts and limits
 */
export const TRANSACTION = {
  /**
   * Maximum age of a prepared transaction before it's considered stale
   * Solana blockhashes are valid for ~60-90 seconds
   * Set to 60 seconds to be safe and avoid expired blockhash errors
   */
  MAX_AGE_SECONDS: 60,
} as const;

// ============================================================
// RETRY CONFIGURATION
// ============================================================

/**
 * Standard retry configuration for failed queries
 */
export const RETRY_CONFIG = {
  DEFAULT_RETRIES: 3,
  /**
   * Exponential backoff retry delay
   * @param attemptIndex - Zero-based retry attempt number
   * @returns Delay in milliseconds
   */
  exponentialDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 10000),
  /**
   * Exponential backoff with longer max delay
   * @param attemptIndex - Zero-based retry attempt number
   * @returns Delay in milliseconds
   */
  longExponentialDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;
