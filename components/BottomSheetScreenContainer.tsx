import React from 'react';
import { ViewStyle } from 'react-native';
import ScreenContainer from './ScreenContainer';

interface BottomSheetScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function BottomSheetScreenContainer({
  children,
  style,
  edges = ['bottom'],
}: BottomSheetScreenContainerProps) {
  return (
    <ScreenContainer edges={edges} style={{ marginBottom: 6, ...style }}>
      {children}
    </ScreenContainer>
  );
}
