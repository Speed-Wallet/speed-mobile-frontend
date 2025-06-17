import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '@/constants/colors'; // Assuming colors are used in styles
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenLogo from '@/components/TokenLogo';

interface AmountInputProps {
    address: string | null | undefined;
    amount: string;
    setAmount: (amount: string) => void;
    // selectedPercentage: string; // Uncomment if using percentage selection
    // handlePercentageSelect: (percentage: string) => void; // Uncomment if using percentage selection
}

const AmountInput: React.FC<AmountInputProps> = ({
    address,
    amount,
    setAmount,
    // selectedPercentage, // Uncomment if using percentage selection
    // handlePercentageSelect, // Uncomment if using percentage selection
}) => {
    const {balance, logoURI, symbol} = useTokenBalance(address);

    return (
        <>
            {/* Amount Input */}
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputSection}>
                <View style={styles.amountInputRow}>
                    {address && <TokenLogo logoURI={logoURI} size={24} style={styles.amountTokenIcon} />}
                    <TextInput
                        style={styles.amountTextInput}
                        placeholder="0.00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>
                {address && (
                    <Text style={styles.balanceText}>
                        Max: {balance} {symbol}
                    </Text>
                )}
                {/* <View style={styles.percentagesRow}>
          {['25', '50', '75', 'MAX'].map((perc) => (
            <TouchableOpacity
              key={perc}
              style={[
                styles.percentageChip,
                selectedPercentage === perc && styles.selectedPercentageChip,
              ]}
              onPress={() => handlePercentageSelect(perc)}
            >
              <Text style={[
                styles.percentageChipText,
                selectedPercentage === perc && styles.selectedPercentageChipText,
              ]}>{perc}{perc !== 'MAX' ? '%' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View> */}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: colors.white,
        opacity: 0.7,
        marginBottom: 8,
    },
    amountInputSection: {
        backgroundColor: colors.backgroundMedium,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    amountInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    amountTokenIcon: {
        marginRight: 8,
    },
    amountTextInput: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: colors.white,
        flex: 1,
        paddingVertical: 0,
    },
    balanceText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        textAlign: 'left',
        marginTop: 4,
    },
    // Uncomment if using percentage selection
    // percentagesRow: {
    //   flexDirection: 'row',
    //   justifyContent: 'space-around',
    //   marginTop: 12, // Added margin for spacing
    // },
    // percentageChip: {
    //   backgroundColor: colors.backgroundLight,
    //   paddingVertical: 8,
    //   paddingHorizontal: 16,
    //   borderRadius: 20,
    // },
    // selectedPercentageChip: {
    //   backgroundColor: colors.primary,
    // },
    // percentageChipText: {
    //   fontSize: 14,
    //   fontFamily: 'Inter-Medium',
    //   color: colors.textSecondary,
    // },
    // selectedPercentageChipText: {
    //   color: colors.white,
    // },
});

export default AmountInput;
