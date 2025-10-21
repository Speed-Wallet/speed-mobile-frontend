import React from 'react';
import { ViewStyle } from 'react-native';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { scale, verticalScale } from 'react-native-size-matters';
import ScreenContainer from './ScreenContainer';
import colors from '@/constants/colors';

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
    <BottomSheetView
      style={{
        flex: 1,
        marginHorizontal: scale(20),
        marginVertical: 12,
      }}
    >
      <ScreenContainer
        edges={edges}
        style={{
          backgroundColor: colors.bottomSheetBackground,
          ...style,
        }}
      >
        {children}
      </ScreenContainer>
    </BottomSheetView>
  );
}
