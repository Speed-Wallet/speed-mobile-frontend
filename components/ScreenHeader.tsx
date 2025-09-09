import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import BackButton from './buttons/BackButton';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({
  title,
  onBack,
  showBackButton = true,
  rightElement,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {showBackButton && <BackButton onPress={onBack} />}

      {title && <Text style={styles.title}>{title}</Text>}

      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    minHeight: scale(48),
    position: 'relative',
  },
  title: {
    fontSize: scale(16),
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  rightElement: {
    minWidth: scale(28),
    alignItems: 'flex-end',
  },
});
