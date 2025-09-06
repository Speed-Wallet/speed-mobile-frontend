import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
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
}

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  showArrow = false,
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
      style={styles.button}
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
            <Text style={[styles.buttonText, { color: getTextColor() }]}>
              {title}
            </Text>
            {showArrow && !disabled && (
              <ArrowRight size={scale(20)} color={getArrowColor()} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: verticalScale(54),
    width: '100%',
    borderRadius: moderateScale(27),
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
    gap: scale(8),
  },
  buttonText: {
    fontSize: moderateScale(17),
    fontFamily: 'Inter-SemiBold',
  },
});

export default PrimaryActionButton;
