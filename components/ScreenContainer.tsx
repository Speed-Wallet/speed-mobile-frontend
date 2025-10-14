import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import UnsafeScreenContainer from './UnsafeScreenContainer';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

export default function ScreenContainer({
  children,
  style,
  edges = ['bottom'],
  backgroundColor = colors.backgroundDark,
}: ScreenContainerProps) {
  return (
    <UnsafeScreenContainer style={{ backgroundColor }}>
      <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
        {children}
      </SafeAreaView>
    </UnsafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
