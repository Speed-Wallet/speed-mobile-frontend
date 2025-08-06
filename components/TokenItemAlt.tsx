import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';
import { formatCurrency } from '@/utils/formatters';
import { EnrichedTokenEntry, TokenEntry } from '@/data/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenLogo from './TokenLogo';

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
    globalError,
    isConnectingOrFetchingOverall,
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
      <TokenLogo logoURI={logoURI} size={40} style={styles.tokenIcon} />
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedTokenItem: {
    backgroundColor: colors.backgroundMedium,
    // borderColor: '#1A1A1A', // Retained from previous context, adjust if needed
    // borderWidth: 0.5,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TokenItemAlt;
