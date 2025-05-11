import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        <Stack.Screen name="transaction/send" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transaction/receive" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transaction/withdraw" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transaction/trade" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wallet/cards" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wallet/manage" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wallet/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wallet/connect" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wallet/import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/personal-info" options={{ presentation: 'modal' }} />
        <Stack.Screen name="crypto/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}