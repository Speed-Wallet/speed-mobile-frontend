import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TokenItem from './TokenItem';
import { EnrichedTokenEntry } from '@/data/types';
import { getAllTokenInfo } from '@/data/tokens';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import Animated, { FadeInRight } from 'react-native-reanimated';


type TokenListProps = {
  onSelectToken: (token: EnrichedTokenEntry) => void;
  showBalance?: boolean;
  priceFontSize?: number;
  showSelectorIcon?: boolean;
};

const TokenList = ({ onSelectToken, showBalance, priceFontSize, showSelectorIcon }: TokenListProps) => {
  const [tokens, setTokens] = useState<EnrichedTokenEntry[]>([]);

  useEffect(() => {
    const data = getAllTokenInfo();
    setTokens(data);
  }, []);

  // Batch fetch all token prices at once instead of in each TokenItem
  const coingeckoIds = tokens
    .map(token => token.extensions?.coingeckoId)
    .filter(Boolean) as string[];
  
  const { prices, isLoading: isPricesLoading } = useTokenPrices(coingeckoIds);

  return (
    <View style={styles.container}>
      {tokens.map((token, index) => (
        <Animated.View
          key={token.address + index}
          entering={FadeInRight.delay(100 + (index * 100)).duration(400)}
        >
          <TokenItem
            key={token.address}
            token={token}
            onPress={() => onSelectToken(token)}
            showBalance={showBalance}
            priceFontSize={priceFontSize}
            showSelectorIcon={showSelectorIcon}
            // Pass the pre-fetched price to avoid hook in map
            preloadedPrice={token.extensions?.coingeckoId ? prices[token.extensions.coingeckoId] : undefined}
            isPriceLoading={isPricesLoading}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TokenList;