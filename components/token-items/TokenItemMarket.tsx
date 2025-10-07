import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { scale, moderateScale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { TokenMetadata } from '@/services/tokenAssetService';
import TokenItemBase from './TokenItemBase';

interface TokenItemMarketProps {
  token: TokenMetadata;
  onPress: () => void;
  price?: number; // Optional current price
  priceChangePercentage?: number; // Optional 24h price change
  isLoading?: boolean;
  backgroundColor?: string;
}

/**
 * Token item for market screen - shows symbol, price, and price change
 */
const TokenItemMarket = ({
  token,
  onPress,
  price,
  priceChangePercentage = 0,
  isLoading = false,
  backgroundColor,
}: TokenItemMarketProps) => {
  const isPositiveChange = priceChangePercentage >= 0;
  const hasPrice = price !== undefined && price !== null;

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={backgroundColor}
      secondaryContent={<Text style={styles.symbol}>{token.symbol}</Text>}
      rightContent={
        hasPrice ? (
          <>
            <Text style={styles.price}>{formatCurrency(price)}</Text>
            {priceChangePercentage !== 0 && (
              <View style={styles.changeContainer}>
                {isPositiveChange ? (
                  <ArrowUpRight
                    size={scale(10)}
                    color={colors.success}
                    style={styles.changeIcon}
                  />
                ) : (
                  <ArrowDownRight
                    size={scale(10)}
                    color={colors.error}
                    style={styles.changeIcon}
                  />
                )}
                <Text
                  style={[
                    styles.change,
                    { color: isPositiveChange ? colors.success : colors.error },
                  ]}
                >
                  {formatPercentage(priceChangePercentage)}
                </Text>
              </View>
            )}
          </>
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  symbol: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(3),
  },
  changeIcon: {
    marginRight: scale(3),
  },
  change: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
  },
});

export default TokenItemMarket;
