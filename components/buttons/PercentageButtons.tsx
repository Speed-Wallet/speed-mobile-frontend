import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { EnrichedTokenEntry } from '@/data/types';

interface PercentageButtonsProps {
  fromToken: EnrichedTokenEntry | null;
  fromTokenBalance: number;
  onPercentagePress: (percentage: number) => void;
}

const PercentageButtons: React.FC<PercentageButtonsProps> = ({
  fromToken,
  fromTokenBalance,
  onPercentagePress,
}) => {
  // DRY: Calculate disabled state once
  const isPercentageDisabled =
    !fromToken || !fromTokenBalance || fromTokenBalance <= 0;

  const percentages = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: 'MAX' },
  ];

  return (
    <View style={styles.percentageButtonsContainer}>
      {percentages.map(({ value, label }) => (
        <TouchableOpacity
          key={value}
          style={[
            styles.percentageButton,
            isPercentageDisabled && styles.percentageButtonDisabled,
          ]}
          onPress={() => onPercentagePress(value)}
          disabled={isPercentageDisabled}
        >
          <Text
            style={[
              styles.percentageButtonText,
              isPercentageDisabled && styles.percentageButtonTextDisabled,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  percentageButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between', // Distribute buttons with same approach as keyboard
    width: moderateScale(80), // Fixed width for the percentage buttons column
    gap: moderateScale(10),
  },
  percentageButton: {
    flex: 1, // Each button takes equal height
    paddingVertical: verticalScale(5),
    backgroundColor: colors.backgroundMedium,
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  percentageButtonText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    color: colors.white,
  },
  percentageButtonDisabled: {
    backgroundColor: colors.backgroundMedium,
    borderColor: colors.backgroundLight,
    opacity: 0.5,
  },
  percentageButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default PercentageButtons;
