// import { useTokenPrice } from './useTokenPrices';
// import { useTokenAsset } from './useTokenAsset';

// export const useTokenValue = (
//   address: string | undefined,
//   coingeckoId: string | undefined,
// ) => {
//   const { price } = useTokenPrice(coingeckoId);
//   const { balance: displayQuantity } = useTokenAsset(address);

//   const currentPrice = price;
//   const dollarValue =
//     displayQuantity && currentPrice ? displayQuantity * currentPrice : 0;

//   return {
//     dollarValue,
//     price: currentPrice,
//     balance: displayQuantity,
//     isLoading: !price,
//   };
// };
