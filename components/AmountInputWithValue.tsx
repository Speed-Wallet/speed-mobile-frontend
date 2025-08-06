import React from 'react';
import { View, Text, TextInput, Image, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { formatCurrency } from '@/utils/formatters'; // To format the USD value

interface AmountInputWithValueProps {
  address: string | null | undefined;
  amount: string;
  setAmount: (amount: string) => void;
}

const AmountInputWithValue: React.FC<AmountInputWithValueProps> = ({
  address,
  amount,
  setAmount,
}) => {
  const { logoURI } = useTokenBalance(address);
  const price = 2; // TODO get price

  const numericAmount = parseFloat(amount);
  const usdValue = !isNaN(numericAmount) && price ? numericAmount * price : 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        {address && logoURI && (
          <Image source={{ uri: logoURI }} style={styles.tokenIcon} />
        )}
        <TextInput
          style={styles.amountTextInput}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Text style={styles.usdValueText}>{formatCurrency(usdValue)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12, // Adjust padding as needed
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  amountTextInput: {
    flex: 1, // Take up available space
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: colors.white,
    paddingVertical: 0, // Ensure consistent height
    marginRight: 8, // Space before USD value
    outlineStyle: 'none',
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
