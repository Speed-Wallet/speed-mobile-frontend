import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale, scale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import TokenLogo from '../TokenLogo';
import { formatBalance } from '@/utils/formatters';

interface TokenItemBaseProps {
  // Required base props
  logoURI: string;
  name: string;
  onPress: () => void;

  // Optional UI customization
  backgroundColor?: string;
  isLoading?: boolean;

  // Balance display (will be formatted automatically)
  balance?: number;

  // Content slots
  secondaryContent?: ReactNode; // Content below name (left side)
  rightContent?: ReactNode; // Content on the right side
  rightIcon?: ReactNode; // Optional icon on far right
}

const TokenItemBase = ({
  logoURI,
  name,
  onPress,
  backgroundColor = colors.backgroundMedium,
  isLoading = false,
  balance,
  secondaryContent,
  rightContent,
  rightIcon,
}: TokenItemBaseProps) => {
  // Format balance if provided and not loading
  const formattedBalance =
    balance !== undefined && !isLoading ? formatBalance(balance) : undefined;

  return (
    <View style={[styles.cardContainer, { backgroundColor }]}>
      <TouchableOpacity
        style={styles.touchableContent}
        onPress={onPress}
        disabled={isLoading}
      >
        {/* Left Section - Logo */}
        <View style={styles.leftSection}>
          <TokenLogo logoURI={logoURI} size={moderateScale(32, 0.5)} />
        </View>

        {/* Middle Section - Name & Secondary Content */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          {formattedBalance !== undefined && (
            <Text style={styles.balance}>{formattedBalance}</Text>
          )}
          {secondaryContent}
        </View>

        {/* Right Section - Primary Right Content */}
        {rightContent && (
          <View style={styles.rightContainer}>{rightContent}</View>
        )}

        {/* Far Right - Optional Icon */}
        {rightIcon}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.backgroundMedium,
    borderRadius: 16,
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(155, 155, 155, 0.1)',
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: scale(12),
  },
  infoContainer: {
    flex: 1,
    marginRight: scale(6),
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  balance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default TokenItemBase;
