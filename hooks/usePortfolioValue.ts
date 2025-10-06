import { useTokenAssets } from './useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';

export const usePortfolioValue = () => {
  const walletAddress = useWalletPublicKey();
  const { data, isLoading } = useTokenAssets(walletAddress);

  const portfolioValue =
    data?.tokenBalances?.reduce(
      (sum, token) => sum + (token.totalPrice || 0),
      0,
    ) || 0;

  return {
    portfolioValue,
    isLoading,
  };
};
