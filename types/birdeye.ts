// Birdeye API Types for Solana token data
// Documentation: https://docs.birdeye.so/

/**
 * Token market data from Birdeye API
 * Endpoint: /defi/v3/token/market-data
 * Note: symbol and name are passed as query parameters, not in response
 */
export interface BirdeyeTokenMarketData {
  address: string;
  liquidity: number;
  price: number;
  total_supply: number; // Total supply (snake_case from API)
  circulating_supply: number; // Circulating supply (snake_case from API)
  market_cap: number; // Market cap (snake_case from API)
  fdv: number; // Fully diluted valuation
  is_scaled_ui_token: boolean;
  multiplier: number | null;
}

/**
 * Historical price data point from Birdeye API
 */
export interface BirdeyeHistoricalDataPoint {
  unixTime: number; // Unix timestamp in seconds
  value: number; // Price value at this timestamp
  address?: string;
  type?: string;
}

/**
 * Historical price response from Birdeye API
 * Endpoint: /defi/history_price
 */
export interface BirdeyeHistoricalPriceResponse {
  success: boolean;
  data: {
    items: BirdeyeHistoricalDataPoint[];
  };
}

/**
 * Backend response for token market data
 */
export interface TokenMarketDataResponse {
  success: boolean;
  data: BirdeyeTokenMarketData | null;
  cached: boolean;
  timestamp: string;
  error?: string;
}

/**
 * Backend response for historical prices
 */
export interface HistoricalPricesResponse {
  success: boolean;
  address: string;
  timeframe: string;
  data: {
    items: BirdeyeHistoricalDataPoint[];
  };
  cached: boolean;
  timestamp: string;
  error?: string;
}

/**
 * Supported timeframe periods for historical data
 */
export type TimeframePeriod = '1H' | '1D' | '7D' | '1M' | '1Y';
