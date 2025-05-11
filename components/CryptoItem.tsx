import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

type CryptoItemProps = {
  crypto: any;
  onPress: () => void;
  showBalance?: boolean;
};

const CryptoItem = ({ crypto, onPress, showBalance = true }: CryptoItemProps) => {
  const isPositiveChange = crypto.priceChangePercentage >= 0;
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <Image source={{ uri: crypto.iconUrl }} style={styles.icon} />
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{crypto.symbol}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{crypto.name}</Text>
        <Text style={styles.network}>{crypto.network}</Text>
      </View>
      
      <View style={styles.priceContainer}>
        {showBalance ? (
          <>
            <Text style={styles.balance}>
              {crypto.balance.toFixed(4)} {crypto.symbol}
            </Text>
            <Text style={styles.price}>
              {formatCurrency(crypto.balance * crypto.price)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.price}>
              {formatCurrency(crypto.price)}
            </Text>
            <View style={styles.changeContainer}>
              {isPositiveChange ? (
                <ArrowUpRight size={12} color={colors.success} style={styles.changeIcon} />
              ) : (
                <ArrowDownRight size={12} color={colors.error} style={styles.changeIcon} />
              )}
              <Text 
                style={[
                  styles.change,
                  { color: isPositiveChange ? colors.success : colors.error }
                ]}
              >
                {formatPercentage(crypto.priceChangePercentage)}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundMedium,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  symbolContainer: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: -12,
    marginTop: 24,
  },
  symbol: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  network: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  balance: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeIcon: {
    marginRight: 2,
  },
  change: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default CryptoItem;