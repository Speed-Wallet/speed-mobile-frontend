import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { scale, moderateScale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import {
  formatCurrency,
  formatPercentage,
  formatBalance,
} from '@/utils/formatters';
import { TokenAsset } from '@/services/tokenAssetService';
import TokenItemBase from './TokenItemBase';

interface TokenItemHomeProps {
  token: TokenAsset;
  onPress: () => void;
  isLoading?: boolean;
  backgroundColor?: string;
  tokenPrice?: number; // Price per token from useTokenPrices
  priceChangePercentage?: number; // 24h price change percentage
}

/**
 * Token item for home screen - shows balance and total USD value
 */
const TokenItemHome = ({
  token,
  onPress,
  isLoading = false,
  backgroundColor,
  tokenPrice,
  priceChangePercentage,
}: TokenItemHomeProps) => {
  const hasValidPriceChange =
    priceChangePercentage !== undefined &&
    priceChangePercentage !== null &&
    !isNaN(priceChangePercentage);
  const isPositiveChange = (priceChangePercentage ?? 0) >= 0;

  // Use tokenPrice from props if available, fallback to token.pricePerToken
  const displayPrice = tokenPrice ?? token.pricePerToken ?? 0;

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={backgroundColor}
      secondaryContent={
        <View style={styles.balancePriceContainer}>
          <Text style={styles.balanceText}>
            {isLoading ? '0.00' : formatBalance(token.balance)}
          </Text>
          <Text style={styles.bulletText}>•</Text>
          <Text style={styles.priceText}>
            {isLoading ? formatCurrency(0) : formatCurrency(displayPrice)}
          </Text>
        </View>
      }
      rightContent={
        <>
          <Text style={styles.totalPrice}>
            {isLoading
              ? formatCurrency(0)
              : formatCurrency(token.totalPrice ?? 0)}
          </Text>
          {hasValidPriceChange && priceChangePercentage !== 0 && (
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
      }
    />
  );
};

const styles = StyleSheet.create({
  balancePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  bulletText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginHorizontal: scale(4),
  },
  priceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeIcon: {
    marginRight: scale(3),
  },
  change: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
  },
});

export default TokenItemHome;
