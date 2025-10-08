import { useMemo } from 'react';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import { TokenAsset } from '@/services/tokenAssetService';

/**
 * Hook for send screen token search
 * Filters wallet tokens based on search query (no Jupiter API)
 */
export function useSendTokens(searchQuery: string, excludeAddress?: string) {
  const walletAddress = useWalletPublicKey();

  const { data: tokenAssets, isLoading } = useTokenAssets(walletAddress);

  const tokenList = tokenAssets?.tokenAssets || [];

  // Filter token list based on search query and excludeAddress
  const filteredTokens = useMemo(() => {
    return tokenList
      .filter((token: TokenAsset) =>
        excludeAddress ? token.address !== excludeAddress : true,
      )
      .filter(
        (token: TokenAsset) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [tokenList, excludeAddress, searchQuery]);

  return {
    tokens: filteredTokens,
    isLoading,
  };
}
