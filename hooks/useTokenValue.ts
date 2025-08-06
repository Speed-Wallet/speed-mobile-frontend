import { useTokenPrice } from './useTokenPrices';
import { useTokenBalance } from './useTokenBalance';

export const useTokenValue = (
  address: string | undefined,
  coingeckoId: string | undefined,
) => {
  const { price } = useTokenPrice(coingeckoId);
  const { balance: displayQuantity } = useTokenBalance(address);

  const currentPrice = price;
  const dollarValue =
    displayQuantity && currentPrice ? displayQuantity * currentPrice : 0;

  return {
    dollarValue,
    price: currentPrice,
    balance: displayQuantity,
    isLoading: !price,
  };
};
