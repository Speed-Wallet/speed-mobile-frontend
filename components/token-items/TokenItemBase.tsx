import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import TokenLogo from '../TokenLogo';

interface TokenItemBaseProps {
  // Required base props
  logoURI: string;
  name: string;
  onPress: () => void;

  // Optional UI customization
  backgroundColor?: string;
  isLoading?: boolean;

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
  secondaryContent,
  rightContent,
  rightIcon,
}: TokenItemBaseProps) => {
  return (
    <View style={[styles.cardContainer, { backgroundColor }]}>
      <TouchableOpacity
        style={styles.touchableContent}
        onPress={onPress}
        disabled={isLoading}
      >
        {/* Left Section - Logo */}
        <View style={styles.leftSection}>
          <TokenLogo logoURI={logoURI} size={32} />
        </View>

        {/* Middle Section - Name & Secondary Content */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 2,
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
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default TokenItemBase;
