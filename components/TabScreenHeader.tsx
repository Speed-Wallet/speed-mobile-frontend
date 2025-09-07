import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface TabScreenHeaderProps {
  title: string;
  subtitle: string;
}

export default function TabScreenHeader({
  title,
  subtitle,
}: TabScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(0),
  },
  title: {
    fontSize: moderateScale(22),
    fontFamily: 'Inter-Bold',
    color: colors.textPrimary,
    marginBottom: verticalScale(1),
  },
  subtitle: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});
