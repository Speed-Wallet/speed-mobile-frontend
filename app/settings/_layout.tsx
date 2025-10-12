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
      <Stack.Screen name="kyc" />
      <Stack.Screen name="date-picker" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="change-pin" />
      <Stack.Screen name="view-seed-phrase" />
    </Stack>
  );
}
