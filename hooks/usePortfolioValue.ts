import { useState, useEffect, useMemo } from 'react';
import { getAllTokenInfo } from '@/data/tokens';
import { useTokenValue } from './useTokenValue';

export const usePortfolioValue = () => {
  const tokens = useMemo(() => getAllTokenInfo(), []);

  const tokenValues = tokens.map((token) => {
    const { dollarValue } = useTokenValue(
      token.address,
      token.extensions.coingeckoId,
    );
    return dollarValue;
  });

  const portfolioValue = tokenValues.reduce(
    (sum, value) => sum + (value || 0),
    0,
  );

  return {
    portfolioValue,
    isLoading: tokenValues.some((value) => value === undefined),
  };
};
