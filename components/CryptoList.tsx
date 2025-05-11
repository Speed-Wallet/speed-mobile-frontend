import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import CryptoItem from './CryptoItem';

type CryptoListProps = {
  data: any[];
  onSelectCrypto: (crypto: any) => void;
};

const CryptoList = ({ data, onSelectCrypto }: CryptoListProps) => {
  return (
    <View style={styles.container}>
      {data.map((crypto, index) => (
        <Animated.View 
          key={crypto.id}
          entering={FadeInRight.delay(100 + (index * 100)).duration(400)}
        >
          <CryptoItem 
            crypto={crypto}
            onPress={() => onSelectCrypto(crypto)}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
});

export default CryptoList;