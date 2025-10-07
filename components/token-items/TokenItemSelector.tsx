import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { TokenMetadata } from '@/services/tokenAssetService';
import TokenItemBase from './TokenItemBase';

interface TokenItemSelectorProps {
  token: TokenMetadata;
  onPress: () => void;
  isSelected?: boolean;
  showSelectorIcon?: boolean;
  isLoading?: boolean;
  backgroundColor?: string;
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
}: TokenItemSelectorProps) => {
  const bgColor =
    backgroundColor ||
    (isSelected ? colors.backgroundLight : colors.backgroundMedium);

  return (
    <TokenItemBase
      logoURI={token.logoURI}
      name={token.name}
      onPress={onPress}
      isLoading={isLoading}
      backgroundColor={bgColor}
      secondaryContent={<Text style={styles.symbol}>{token.symbol}</Text>}
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
  selectorIcon: {
    marginLeft: scale(6),
  },
});

export default TokenItemSelector;
