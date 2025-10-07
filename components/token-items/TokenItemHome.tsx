import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { formatCurrency, getDecimalsToShow } from '@/utils/formatters';
import { TokenAsset } from '@/services/tokenAssetService';
import TokenItemBase from './TokenItemBase';

interface TokenItemHomeProps {
  token: TokenAsset;
  onPress: () => void;
  isLoading?: boolean;
  backgroundColor?: string;
}

/**
 * Token item for home screen - shows balance and total USD value
 */
const TokenItemHome = ({
  token,
  onPress,
  isLoading = false,
  backgroundColor,
}: TokenItemHomeProps) => {
  const decimalsShown = getDecimalsToShow(token.balance, token.decimals);

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={backgroundColor}
      secondaryContent={
        <Text style={styles.balance}>
          {isLoading
            ? '0.0000'
            : typeof token.balance === 'number'
              ? token.balance.toFixed(decimalsShown)
              : '0.0000'}
        </Text>
      }
      rightContent={
        <Text style={styles.totalPrice}>
          {isLoading
            ? formatCurrency(0)
            : formatCurrency(token.totalPrice ?? 0)}
        </Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  balance: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenItemHome;
