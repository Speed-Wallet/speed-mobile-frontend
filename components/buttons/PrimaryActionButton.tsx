import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';

import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface PrimaryActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'error';
  icon?: React.ReactNode; // pass actual component, not string
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.backgroundMedium;

    switch (variant) {
      case 'success':
        return colors.primary;
      case 'error':
        return '#ff5252';
      case 'primary':
      default:
        return '#00CFFF';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    return variant === 'success' || variant === 'error' ? colors.white : '#000';
  };

  const renderIcon = () => {
    if (!icon || disabled) return null;
    return icon;
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.buttonBackground,
          { backgroundColor: getBackgroundColor() },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <>
            {iconPosition === 'left' && renderIcon()}
            <Text style={[styles.buttonText, { color: getTextColor() }]}>
              {title}
            </Text>
            {iconPosition === 'right' && renderIcon()}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(50, 0.1),
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: scale(4),
  },
  buttonText: {
    fontSize: moderateScale(16, 0.1),
    fontFamily: 'Inter-SemiBold',
  },
});

export default PrimaryActionButton;
