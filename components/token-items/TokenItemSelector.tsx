import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { TokenMetadata } from '@/services/tokenAssetService';
import { formatBalance } from '@/utils/formatters';
import TokenItemBase from './TokenItemBase';

interface TokenItemSelectorProps {
  token: TokenMetadata;
  onPress: () => void;
  isSelected?: boolean;
  showSelectorIcon?: boolean;
  isLoading?: boolean;
  backgroundColor?: string;
  balance?: number;
  totalPrice?: number;
}

/**
 * Token item for token selector - shows just name and symbol
 */
const TokenItemSelector = ({
  token,
  onPress,
  isSelected = false,
  showSelectorIcon = false,
  isLoading = false,
  backgroundColor,
  balance,
  totalPrice,
}: TokenItemSelectorProps) => {
  const bgColor =
    backgroundColor ||
    (isSelected ? colors.backgroundLight : colors.backgroundMedium);

  // Create right content if balance or totalPrice is provided
  const rightContent =
    balance !== undefined || totalPrice !== undefined ? (
      <>
        {balance !== undefined && (
          <Text style={styles.balance}>{formatBalance(balance)}</Text>
        )}
        {totalPrice !== undefined && (
          <Text style={styles.totalPrice}>
            $
            {totalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        )}
      </>
    ) : undefined;

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={bgColor}
      secondaryContent={<Text style={styles.symbol}>{token.symbol}</Text>}
      rightContent={rightContent}
      rightIcon={
        showSelectorIcon ? (
          <ChevronDown
            color={colors.textSecondary}
            size={scale(18)}
            style={styles.selectorIcon}
          />
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
  balance: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  selectorIcon: {
    marginLeft: scale(6),
  },
});

export default TokenItemSelector;
