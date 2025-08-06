import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';

interface SettingsScreenProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
  bottomElement?: React.ReactNode;
}

export default function SettingsScreen({
  title,
  onBack,
  rightElement,
  children,
  scrollable = true,
  bottomElement,
}: SettingsScreenProps) {
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScreenHeader title={title} onBack={onBack} rightElement={rightElement} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {bottomElement}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
