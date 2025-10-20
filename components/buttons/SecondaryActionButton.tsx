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

interface SecondaryActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const SecondaryActionButton: React.FC<SecondaryActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonBackground}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <>
            <Text
              style={[
                styles.buttonText,
                { color: disabled ? colors.textSecondary : colors.textPrimary },
              ]}
            >
              {title}
            </Text>
            {icon}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 14,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
  },
  buttonBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    width: '100%',
  },
  buttonText: {
    fontSize: scale(15),
    fontFamily: 'Inter-SemiBold',
  },
});

export default SecondaryActionButton;
