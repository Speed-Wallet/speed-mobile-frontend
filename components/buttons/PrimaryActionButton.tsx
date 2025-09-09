import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface PrimaryActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'error';
  showArrow?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  showArrow = false,
  icon,
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

  const getArrowColor = () => {
    if (disabled) return colors.textSecondary;
    return variant === 'primary' ? '#000' : colors.white;
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
            {icon}
            <Text style={[styles.buttonText, { color: getTextColor() }]}>
              {title}
            </Text>
            {showArrow && !disabled && (
              <ArrowRight size={scale(16)} color={getArrowColor()} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(54, 0.1),
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
