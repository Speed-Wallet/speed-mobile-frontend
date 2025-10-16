/**
 * Jupiter Price API service
 * Fetches token prices from Jupiter's lite API
 */

const JUPITER_PRICE_API = 'https://lite-api.jup.ag/price/v3';

export interface JupiterPriceData {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

export interface JupiterPriceResponse {
  [mintAddress: string]: JupiterPriceData;
}

/**
 * Fetch prices for multiple tokens from Jupiter
 * @param mintAddresses Array of token mint addresses
 * @returns Object mapping mint addresses to price data
 */
export const getJupiterPrices = async (
  mintAddresses: string[],
): Promise<JupiterPriceResponse> => {
  if (mintAddresses.length === 0) {
    return {};
  }

  const ids = mintAddresses.join(',');
  const url = `${JUPITER_PRICE_API}?ids=${ids}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Jupiter prices: ${response.statusText}`);
  }

  return response.json();
};
