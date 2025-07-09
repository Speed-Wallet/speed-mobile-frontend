import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';

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
  style 
}: ScreenHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={[styles.header, style]}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
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
