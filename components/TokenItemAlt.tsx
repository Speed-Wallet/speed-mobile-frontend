import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { EnrichedTokenEntry, TokenEntry } from '@/data/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenLogo from './TokenLogo';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface TokenItemAltProps {
  token: EnrichedTokenEntry;
  selectedToken: TokenEntry | null;
  onSelectToken: (token: EnrichedTokenEntry) => void;
}

const TokenItemAlt: React.FC<TokenItemAltProps> = ({
  token,
  selectedToken,
  onSelectToken,
}) => {
  const {
    balance,
    loading: isLoading,
    error: _error,
    decimalsShown,
    name,
    symbol,
    logoURI,
  } = useTokenBalance(token.address);
  const price = 2;

  return (
    <TouchableOpacity
      style={[
        styles.tokenItem,
        selectedToken?.address === token.address && styles.selectedTokenItem,
      ]}
      onPress={() => onSelectToken(token)}
    >
      <TokenLogo logoURI={logoURI} size={scale(32)} style={styles.tokenIcon} />
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenName}>{name}</Text>
        <Text style={styles.tokenSymbol}>{symbol}</Text>
      </View>
      <View style={styles.tokenBalance}>
        <Text style={styles.balanceText}>{balance.toFixed(decimalsShown)}</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(balance * price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    marginBottom: 4,
  },
  selectedTokenItem: {
    backgroundColor: colors.backgroundMedium,
    // borderColor: '#1A1A1A', // Retained from previous context, adjust if needed
    // borderWidth: 0.5,
  },
  tokenIcon: {
    width: scale(32), // Reduced from 40
    height: scale(32), // Reduced from 40
    borderRadius: scale(16), // Half of width/height
    marginRight: scale(10), // Reduced from 12
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: moderateScale(14), // Reduced from 16
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: verticalScale(2), // Reduced from 4
  },
  tokenSymbol: {
    fontSize: moderateScale(12), // Reduced from 14
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: moderateScale(14), // Reduced from 16
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: verticalScale(2), // Reduced from 4
  },
  balanceValue: {
    fontSize: moderateScale(12), // Reduced from 14
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenItemAlt;
