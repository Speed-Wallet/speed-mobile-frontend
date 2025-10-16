import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
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
  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={backgroundColor}
      balance={token.balance}
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
  totalPrice: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenItemHome;
