import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import GreyCard from './GreyCard';
import TokenLogo from './TokenLogo';

// Define constants for image sizes
const TOKEN_SYMBOL_CONTAINER_SIZE = scale(36);

type TokenItemProps = {
  balance: number;
  pricePerToken: number;
  totalPrice: number;
  logoURI: string;
  name: string;
  symbol: string;
  decimals: number;
  isLoading?: boolean;
  onPress: () => void;
  showBalance?: boolean;
  priceFontSize?: number; // Optional prop for dollar value size
  showSelectorIcon?: boolean; // Optional prop for showing selector icon
  priceChangePercentage?: number; // Optional for showing price change in market view
};

const TokenItem = ({
  balance,
  pricePerToken,
  totalPrice,
  logoURI,
  name,
  symbol,
  decimals,
  isLoading = false,
  onPress,
  showBalance = true,
  priceFontSize = 14,
  showSelectorIcon,
  priceChangePercentage = 0,
}: TokenItemProps) => {
  const isPositiveChange = priceChangePercentage >= 0;

  const decimalsShown = Math.min(balance < 1 ? 6 : 4, decimals);

  return (
    <GreyCard
      style={styles.cardStyle}
      contentPaddingVertical={10}
      contentPaddingHorizontal={16}
    >
      <TouchableOpacity style={styles.touchableContent} onPress={onPress}>
        <View style={styles.leftSection}>
          <TokenLogo logoURI={logoURI} size={TOKEN_SYMBOL_CONTAINER_SIZE} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          {showBalance && (
            // Only the token quantity and symbol remain here
            // Apply styles.price instead of styles.balance and add marginTop
            <Text style={[styles.price, { marginTop: 4 }]}>
              {/* Ensure balance is a number before calling toFixed */}
              {isLoading
                ? '0.0000'
                : typeof balance === 'number'
                  ? balance.toFixed(decimalsShown)
                  : '0.0000'}{' '}
              {symbol}
            </Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          {showBalance ? (
            // Display dollar value of the balance here
            <Text style={[styles.price, { fontSize: priceFontSize }]}>
              {/* Ensure totalPrice is valid before formatting */}
              {isLoading
                ? formatCurrency(0)
                : formatCurrency(
                    typeof totalPrice === 'number' ? totalPrice : 0,
                  )}
            </Text>
          ) : (
            // Display token's general price and change percentage
            <>
              <Text style={[styles.price, { fontSize: priceFontSize }]}>
                {formatCurrency(pricePerToken ?? 0)}
              </Text>
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
            </>
          )}
        </View>
        {showSelectorIcon && (
          <ChevronDown
            color={colors.textSecondary}
            size={scale(18)}
            style={styles.selectorIcon}
          />
        )}
      </TouchableOpacity>
    </GreyCard>
  );
};

const styles = StyleSheet.create({
  cardStyle: {
    // Style for the GreyCard itself
    marginBottom: 4,
  },
  touchableContent: {
    // Style for the TouchableOpacity wrapping the content inside GreyCard
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(12),
  },
  icon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(6),
  },
  infoContainer: {
    flex: 1,
    marginRight: scale(6), // Add some margin to prevent text from touching priceContainer when balance is not shown
  },
  name: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center', // Align items vertically in case only price/change is shown
  },
  // The balance style is no longer used for the token amount,
  // but might be used elsewhere or can be removed if not.
  // For now, I will leave it in case it's used by other components or for future use.
  balance: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
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
  selectorIcon: {
    marginLeft: scale(6), // Add some space between the price container and the icon
  },
});

export default TokenItem;
