import { useQuery } from '@tanstack/react-query';
import { TokenAsset } from '@/services/tokenAssetService';
import {
  getJupiterPrices,
  JupiterPriceResponse,
} from '@/services/jupiterPriceService';
import {
  USDC_TOKEN,
  USDT_TOKEN,
  cbBTC_TOKEN,
  WETH_TOKEN,
  WBNB_TOKEN,
} from '@/constants/popularTokens';
import { CACHE_TIME } from '@/constants/cache';

// Suggested tokens to show at the bottom
const SUGGESTED_TOKENS = [
  USDC_TOKEN,
  cbBTC_TOKEN,
  WETH_TOKEN,
  WBNB_TOKEN,
  USDT_TOKEN,
];

/**
 * Hook to get suggested tokens (tokens user doesn't own yet) with their prices
 * Returns TokenAsset-like objects that can be displayed in the token list
 */
export const useSuggestedTokens = (userTokens: TokenAsset[] | undefined) => {
  // Filter out tokens the user already owns
  const tokensToFetch = SUGGESTED_TOKENS.filter(
    (suggestedToken) =>
      !userTokens?.some(
        (userToken) => userToken.address === suggestedToken.address,
      ),
  );

  const mintAddresses = tokensToFetch.map((token) => token.address);

  const { data: priceData, isLoading } = useQuery<JupiterPriceResponse>({
    queryKey: ['jupiterPrices', mintAddresses],
    queryFn: () => getJupiterPrices(mintAddresses),
    enabled: mintAddresses.length > 0,
    refetchInterval: CACHE_TIME.TOKEN_ASSETS.REFETCH_INTERVAL,
    staleTime: CACHE_TIME.TOKEN_ASSETS.STALE_TIME,
    gcTime: CACHE_TIME.TOKEN_ASSETS.GC_TIME,
  });

  // Convert suggested tokens to TokenAsset format
  const suggestedTokenAssets: TokenAsset[] = tokensToFetch.map((token) => {
    const priceInfo = priceData?.[token.address];
    const usdPrice = priceInfo?.usdPrice || 0;

    return {
      address: token.address,
      mint: token.address,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI,
      decimals: token.decimals,
      balance: 0,
      rawBalance: '0',
      tokenStandard: 'Token',
      pricePerToken: usdPrice,
      totalPrice: 0, // Balance is 0, so total is 0
      currency: 'USD',
      isSuggested: true, // Flag to indicate this is a suggested token
    } as TokenAsset;
  });

  return {
    suggestedTokens: suggestedTokenAssets,
    isLoading,
  };
};
