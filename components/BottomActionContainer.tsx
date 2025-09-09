import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface BottomActionContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const BottomActionContainer: React.FC<BottomActionContainerProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMedium,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
});

export default BottomActionContainer;
