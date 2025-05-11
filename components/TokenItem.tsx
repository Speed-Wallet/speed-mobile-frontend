import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

type TokenItemProps = {
  token: any;
  onPress: () => void;
  showBalance?: boolean;
};

const TokenItem = ({ token, onPress, showBalance = true }: TokenItemProps) => {
  const isPositiveChange = token.priceChangePercentage >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <Image source={{ uri: token.iconUrl }} style={styles.icon} />
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{token.symbol}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{token.name}</Text>
        <Text style={styles.network}>{token.network}</Text>
      </View>
      
      <View style={styles.priceContainer}>
        {showBalance ? (
          <>
            <Text style={styles.balance}>
              {token.balance.toFixed(4)} {token.symbol}
            </Text>
            <Text style={styles.price}>
              {formatCurrency(token.balance * token.price)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.price}>
              {formatCurrency(token.price)}
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
                {formatPercentage(token.priceChangePercentage)}
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
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  symbolContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  symbol: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  network: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeIcon: {
    marginRight: 4,
  },
  change: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default TokenItem;