import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';
import BackButton from './BackButton';

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
      {showBackButton ? (
        <BackButton onPress={onBack} />
      ) : (
        <View style={styles.placeholder} />
      )}

      {title && <Text style={styles.title}>{title}</Text>}

      {rightElement ? (
        <View style={styles.rightElement}>{rightElement}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  rightElement: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
});
