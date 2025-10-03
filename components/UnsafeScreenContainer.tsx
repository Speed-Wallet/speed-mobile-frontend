import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface UnsafeScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function UnsafeScreenContainer({
  children,
  style,
}: UnsafeScreenContainerProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
});
