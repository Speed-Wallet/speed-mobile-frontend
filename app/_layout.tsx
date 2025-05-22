import { Buffer } from 'buffer';
global.Buffer = Buffer; // Polyfill global Buffer
import 'react-native-get-random-values'; // Ensure this is at the very top


import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { checkStoredWallet, useWalletPublicKey } from '@/services/walletService';
import SetupWalletScreen from '@/app/wallet/SetupWalletScreen';
import EnterPinScreen from '@/app/wallet/EnterPinScreen';
import colors from '@/constants/colors';
import { useTokenBalanceStore } from '@/stores/tokenBalanceStore';

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

  const [walletState, setWalletState] = useState<'loading' | 'no_wallet' | 'locked' | 'unlocked'>('loading');
  const [storedPublicKey, setStoredPublicKey] = useState<string | null>(null);

  useEffect(() => {
    async function checkWalletStatus() {
      try {
        const walletInfo = await checkStoredWallet();
        if (walletInfo.isEncrypted && walletInfo.publicKey) {
          setStoredPublicKey(walletInfo.publicKey);
          setWalletState('locked');
        } else {
          setWalletState('no_wallet');
        }
      } catch (e) {
        console.error("Failed to check wallet status:", e);
        setWalletState('no_wallet');
      }
    }
    if (fontsLoaded || fontError) {
      checkWalletStatus();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && walletState !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, walletState]);

  const subscribeToTokenBalances = useTokenBalanceStore((state) => state.subscribeToTokenBalances);
  const activeWalletPublicKey = useWalletPublicKey();
  alert("active wallet public key in app/_layout: " + activeWalletPublicKey);
  
  useEffect(() => {
    subscribeToTokenBalances(activeWalletPublicKey);
  }, [activeWalletPublicKey, subscribeToTokenBalances]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (walletState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (walletState === 'no_wallet') {
    return <SetupWalletScreen onWalletSetupComplete={() => setWalletState('unlocked')} />;
  }

  if (walletState === 'locked') {
    return <EnterPinScreen onWalletUnlocked={() => setWalletState('unlocked')} publicKey={storedPublicKey} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { paddingTop: 10, backgroundColor: colors.backgroundDark } }}>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
  }
});