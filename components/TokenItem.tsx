import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react-native';
import colors from '@/constants/colors';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import GreyCard from './GreyCard';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { EnrichedTokenEntry } from '@/data/types';
import TokenLogo from './TokenLogo';

// Define constants for image sizes
const TOKEN_SYMBOL_CONTAINER_SIZE = 40;

type TokenItemProps = {
  token: EnrichedTokenEntry;
  onPress: () => void;
  showBalance?: boolean;
  priceFontSize?: number; // Optional prop for dollar value size
  showSelectorIcon?: boolean; // Optional prop for showing selector icon
  preloadedPrice?: number; // For when price is fetched in batch
  isPriceLoading?: boolean; // For when price loading state is managed externally
};

const TokenItem = ({
  token,
  onPress,
  showBalance = true,
  priceFontSize = 14,
  showSelectorIcon,
  preloadedPrice,
  isPriceLoading: externalIsPriceLoading,
}: TokenItemProps) => {
  const isPositiveChange = token.priceChangePercentage >= 0;

  const coingeckoId = token.extensions.coingeckoId;

  // Only use the hook if no preloaded price is provided
  const {
    price: fetchedPrice,
    isLoading: hookIsPriceLoading,
    error: priceError,
  } = useTokenPrice(preloadedPrice !== undefined ? undefined : coingeckoId);

  // Use preloaded price first, then fetched price, then fallback to 0
  const currentPrice = preloadedPrice ?? fetchedPrice ?? 0;
  const isPriceLoading = externalIsPriceLoading ?? hookIsPriceLoading;

  // const activeWalletPublicKey = useWalletPublicKey();
  const {
    balance: displayQuantity,
    loading: isLoading,
    error: _error,
    globalError,
    isConnectingOrFetchingOverall,
    decimalsShown,
  } = useTokenBalance(token.address);
  const displayDollarValue = displayQuantity
    ? displayQuantity * currentPrice
    : undefined;
  const error = _error || globalError; // Combine WebSocket and store errors

  return (
    <GreyCard
      style={styles.cardStyle}
      contentPaddingVertical={16}
      contentPaddingHorizontal={16}
    >
      <TouchableOpacity style={styles.touchableContent} onPress={onPress}>
        <View style={styles.leftSection}>
          <TokenLogo
            logoURI={token.logoURI}
            size={TOKEN_SYMBOL_CONTAINER_SIZE}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{token.name}</Text>
          {showBalance && (
            // Only the token quantity and symbol remain here
            // Apply styles.price instead of styles.balance and add marginTop
            <Text style={[styles.price, { marginTop: 4 }]}>
              {/* Ensure displayQuantity is a number before calling toFixed */}
              {isLoading
                ? '0.0000'
                : typeof displayQuantity === 'number'
                  ? displayQuantity.toFixed(decimalsShown)
                  : '0.0000'}{' '}
              {token.symbol}
            </Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          {showBalance ? (
            // Display dollar value of the balance here
            <Text style={[styles.price, { fontSize: priceFontSize }]}>
              {/* Ensure displayDollarValue is valid before formatting */}
              {isLoading
                ? formatCurrency(0)
                : formatCurrency(
                    typeof displayDollarValue === 'number'
                      ? displayDollarValue
                      : 0,
                  )}
            </Text>
          ) : (
            // Display token's general price and change percentage
            <>
              <Text style={[styles.price, { fontSize: priceFontSize }]}>
                {isPriceLoading
                  ? formatCurrency(token.price)
                  : formatCurrency(currentPrice)}
              </Text>
              <View style={styles.changeContainer}>
                {isPositiveChange ? (
                  <ArrowUpRight
                    size={12}
                    color={colors.success}
                    style={styles.changeIcon}
                  />
                ) : (
                  <ArrowDownRight
                    size={12}
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
                  {formatPercentage(token.priceChangePercentage)}
                </Text>
              </View>
            </>
          )}
        </View>
        {showSelectorIcon && (
          <ChevronDown
            color={colors.textSecondary}
            size={20}
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
    marginBottom: 8,
  },
  touchableContent: {
    // Style for the TouchableOpacity wrapping the content inside GreyCard
    flexDirection: 'row',
    alignItems: 'center',
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
  infoContainer: {
    flex: 1,
    marginRight: 8, // Add some margin to prevent text from touching priceContainer when balance is not shown
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
    justifyContent: 'center', // Align items vertically in case only price/change is shown
  },
  // The balance style is no longer used for the token amount,
  // but might be used elsewhere or can be removed if not.
  // For now, I will leave it in case it's used by other components or for future use.
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
  selectorIcon: {
    marginLeft: 8, // Add some space between the price container and the icon
  },
});

export default TokenItem;
