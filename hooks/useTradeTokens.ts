import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import { TokenAsset, TokenMetadata } from '@/services/tokenAssetService';
import { POPULAR_TOKENS } from '@/constants/popularTokens';
import { JupiterToken } from '@/types/jupiter';

/**
 * Hook for trade screen token search
 * Combines wallet tokens, popular tokens, and Jupiter API search results
 */
export function useTradeTokens(searchQuery: string, excludeAddress?: string) {
  const walletAddress = useWalletPublicKey();
  const [jupiterSearchResults, setJupiterSearchResults] = useState<
    TokenMetadata[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: tokenAssets, isLoading: isLoadingBalances } =
    useTokenAssets(walletAddress);

  const tokenList = tokenAssets?.tokenAssets || [];

  // Search Jupiter API with debounce
  const searchJupiterTokens = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setJupiterSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`,
      );
      const searchResults: JupiterToken[] = await response.json();

      // Convert JupiterToken to TokenMetadata immediately
      const convertedResults: TokenMetadata[] = searchResults.map(
        (jupToken) => ({
          address: jupToken.id,
          name: jupToken.name,
          symbol: jupToken.symbol,
          logoURI: jupToken.icon,
          decimals: jupToken.decimals,
        }),
      );

      setJupiterSearchResults(convertedResults);
    } catch (error) {
      console.error('Error searching Jupiter tokens:', error);
      setJupiterSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Immediately clear old results and show loading state when search query changes
    if (searchQuery && searchQuery.length >= 2) {
      setJupiterSearchResults([]);
      setIsSearching(true);
    } else {
      setJupiterSearchResults([]);
      setIsSearching(false);
    }

    // Set new timeout for 2 seconds
    searchTimeoutRef.current = setTimeout(() => {
      searchJupiterTokens(searchQuery);
    }, 2000);

    // Cleanup on unmount or when searchQuery changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchJupiterTokens]);

  // Combine user tokens with popular tokens
  const combinedTokenList = useMemo(() => {
    const userTokenAddresses = new Set(
      tokenList.map((t: TokenAsset) => t.address),
    );

    // Filter out popular tokens that user already has
    const additionalPopularTokens = POPULAR_TOKENS.filter(
      (token) => !userTokenAddresses.has(token.address),
    );

    // Combine: user tokens first, then popular tokens
    return [...tokenList, ...additionalPopularTokens];
  }, [tokenList]);

  // Filter combined list and add Jupiter search results
  const filteredTokens = useMemo(() => {
    // Filter the combined token list
    const filtered = combinedTokenList
      .filter((token: TokenAsset | TokenMetadata) =>
        excludeAddress ? token.address !== excludeAddress : true,
      )
      .filter(
        (token: TokenAsset | TokenMetadata) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    // Add Jupiter search results if we have any
    if (jupiterSearchResults.length > 0) {
      // Filter out Jupiter results that are already in the filtered list
      const existingAddresses = new Set(
        filtered.map((token: TokenAsset | TokenMetadata) => token.address),
      );

      const uniqueJupiterResults = jupiterSearchResults.filter(
        (jupToken) =>
          !existingAddresses.has(jupToken.address) &&
          (excludeAddress ? jupToken.address !== excludeAddress : true),
      );

      // Return filtered list followed by unique Jupiter results
      return [...filtered, ...uniqueJupiterResults];
    }

    return filtered;
  }, [combinedTokenList, excludeAddress, searchQuery, jupiterSearchResults]);

  return {
    tokens: filteredTokens,
    isLoading: isLoadingBalances || isSearching,
  };
}
