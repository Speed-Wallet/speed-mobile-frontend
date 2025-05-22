import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import TokenItem from './TokenItem';
import { EnrichedTokenEntry } from '@/data/types';


type TokenListProps = {
  data: EnrichedTokenEntry[];
  onSelectToken: (token: EnrichedTokenEntry) => void;
};

const TokenList = ({ data, onSelectToken }: TokenListProps) => {
  return (
    <View style={styles.container}>
      {data.map((token, index) => (
        <Animated.View 
          key={token.address + index}
          entering={FadeInRight.delay(100 + (index * 100)).duration(400)}
        >
          <TokenItem
            token={token}
            onPress={() => onSelectToken(token)}
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