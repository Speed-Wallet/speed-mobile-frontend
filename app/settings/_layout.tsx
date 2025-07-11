import React from 'react';
import { Stack } from 'expo-router';
import ScreenContainer from '@/components/ScreenContainer';
import ScreenHeader from '@/components/ScreenHeader';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // We'll handle headers ourselves
      }}
    >
      <Stack.Screen name="wallets" />
      <Stack.Screen name="security" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="country-picker" />
      <Stack.Screen name="date-picker" />
    </Stack>
  );
}
