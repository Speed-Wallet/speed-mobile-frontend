import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TokenItem from './TokenItem';
import { EnrichedTokenEntry } from '@/data/types';
import { getAllTokenInfo } from '@/data/tokens';
import Animated, { FadeInRight } from 'react-native-reanimated';


type TokenListProps = {
  onSelectToken: (token: EnrichedTokenEntry) => void;
  showBalance?: boolean;
  priceFontSize?: number;
  showSelectorIcon?: boolean;
};

const TokenList = ({ onSelectToken, showBalance = true, priceFontSize, showSelectorIcon }: TokenListProps) => {
  const [tokens, setTokens] = useState<EnrichedTokenEntry[]>([]);

  useEffect(() => {
    const data = getAllTokenInfo();
    setTokens(data);
  }, []);

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