import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { useTokenAsset } from '@/hooks/useTokenAsset';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenPrice } from '@/hooks/useTokenPrices';
import { formatPrice, formatBalance } from '@/utils/formatters';
import TokenLogo from './TokenLogo';

interface AmountInputWithValueProps {
  address: string | null | undefined;
  amount: string;
  setAmount: (amount: string) => void;
  onInsufficientBalance?: (insufficient: boolean, symbol?: string) => void;
}

const AmountInputWithValue: React.FC<AmountInputWithValueProps> = ({
  address,
  amount,
  setAmount,
  onInsufficientBalance,
}) => {
  const { logoURI, symbol, balance } = useTokenAsset(address);
  const { price } = useTokenPrice(address || undefined);

  const numericAmount = parseFloat(amount);
  const usdValue = !isNaN(numericAmount) && price ? numericAmount * price : 0;

  // Check if amount exceeds balance
  const hasInsufficientBalance = numericAmount > 0 && numericAmount > balance;

  // Notify parent of insufficient balance state
  useEffect(() => {
    if (onInsufficientBalance) {
      onInsufficientBalance(hasInsufficientBalance, symbol);
    }
  }, [hasInsufficientBalance, symbol, onInsufficientBalance]);

  return (
    <View
      style={[
        styles.container,
        hasInsufficientBalance && styles.containerError,
      ]}
    >
      <View style={styles.inputRow}>
        <TextInput
          style={styles.amountTextInput}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Text style={styles.usdValueText}>
          {usdValue > 0 ? formatPrice(usdValue) : '$0.00'}
        </Text>
      </View>
      {balance > 0 && (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceText}>
            Balance: {formatBalance(balance)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(155, 155, 155, 0.1)',
  },
  containerError: {
    borderColor: colors.error,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundLight,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  tokenIcon: {
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1, // Take up available space
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.white,
    paddingVertical: 0, // Ensure consistent height
    marginRight: 8, // Space before USD value
    minWidth: 0, // Ensure it can shrink properly
  },
  usdValueText: {
    fontSize: 16, // Adjust size as needed
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary, // Or another color like colors.primary
    flexShrink: 0, // Prevent this text from shrinking
  },
});

export default AmountInputWithValue;
