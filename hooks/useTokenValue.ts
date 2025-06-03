import { useTokenPrice } from './useTokenPrice';
import { useTokenBalance } from './useTokenBalance';

export const useTokenValue = (address: string | undefined, coingeckoId: string | undefined) => {
  const { data: fetchedPrice } = useTokenPrice(coingeckoId);
  const { balance: displayQuantity } = useTokenBalance(address);
  
  const currentPrice = fetchedPrice;
  const dollarValue = displayQuantity && currentPrice ? displayQuantity * currentPrice : 0;
  
  return {
    dollarValue,
    price: currentPrice,
    balance: displayQuantity,
    isLoading: !fetchedPrice
  };
};
