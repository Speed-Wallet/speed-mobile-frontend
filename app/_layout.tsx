import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  setBackgroundColorAsync,
  setButtonStyleAsync,
  setPositionAsync,
  setVisibilityAsync,
} from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import {
  checkStoredWallet,
  useWalletPublicKey,
} from '@/services/walletService';
import SetupWalletScreen from '@/app/wallet/SetupWalletScreen';
import EnterPinScreen from '@/app/wallet/EnterPinScreen';
import KYCScreen from '@/app/settings/kyc';
import OnboardingCarousel from '@/components/OnboardingCarousel';
import DevStartupScreen from '@/components/DevStartupScreen';
import colors from '@/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthService } from '@/services/authService';
import { AlertProvider } from '@/providers/AlertProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { prefetchAppConfig } from '@/utils/configPrefetch';
import { StorageService } from '@/utils/storage';
import 'react-native-get-random-values';

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

  const [walletState, setWalletState] = useState<
    | 'loading'
    | 'welcome'
    | 'onboarding'
    | 'dev_startup'
    | 'no_wallet'
    | 'locked'
    | 'kyc_pending'
    | 'unlocked'
  >('loading');
  const [storedPublicKey, setStoredPublicKey] = useState<string | null>(null);
  const [hasExistingWallet, setHasExistingWallet] = useState<boolean>(false);

  // Setup navigation bar for Android
  useEffect(() => {
    async function setupNavigationBar() {
      if (Platform.OS === 'android') {
        try {
          await setBackgroundColorAsync('#121212');
          await setButtonStyleAsync('dark');
          // Also set status bar color on Android
          await setPositionAsync('absolute');
          await setVisibilityAsync('visible');
        } catch (error) {
          console.error('Failed to setup navigation bar:', error);
        }
      }
    }
    setupNavigationBar();
  }, []);

  useEffect(() => {
    async function checkWalletStatus() {
      try {
        // Initialize auth service
        await AuthService.initialize();

        const walletInfo = await checkStoredWallet();
        const hasWallet = walletInfo.isEncrypted && walletInfo.publicKey;
        setHasExistingWallet(!!hasWallet);

        // In development mode, show dev startup screen first
        if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
          setWalletState('dev_startup');
          return;
        }

        if (hasWallet) {
          setStoredPublicKey(walletInfo.publicKey);
          setWalletState('locked');
        } else {
          // First time user - show welcome screen
          setWalletState('welcome');
        }
      } catch (e) {
        console.error('Failed to check wallet status:', e);
        setWalletState(
          process.env.EXPO_PUBLIC_APP_ENV === 'development'
            ? 'dev_startup'
            : 'welcome',
        );
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

  // Initialize new token balance system
  const activeWalletPublicKey = useWalletPublicKey();

  const [queryClient] = useState(() => new QueryClient());

  // Helper function to check if KYC is complete
  const checkKYCComplete = (): boolean => {
    console.log('🔍 [KYC CHECK] ========================================');
    console.log('🔍 [KYC CHECK] checkKYCComplete called in _layout.tsx');
    console.log('🔍 [KYC CHECK] ========================================');

    try {
      const personalInfo = StorageService.loadPersonalInfo();
      console.log('🔍 [KYC CHECK] Loaded personalInfo:', personalInfo);

      if (!personalInfo) {
        console.log('🔍 [KYC CHECK] ❌ No personalInfo found - KYC incomplete');
        return false;
      }

      // Check if all required KYC fields are filled
      const isComplete = !!(
        personalInfo.name &&
        personalInfo.email &&
        personalInfo.phoneNumber &&
        personalInfo.dateOfBirth &&
        personalInfo.address &&
        personalInfo.streetNumber &&
        personalInfo.selectedCountry
      );

      console.log('🔍 [KYC CHECK] Field checks:');
      console.log('  - name:', !!personalInfo.name);
      console.log('  - email:', !!personalInfo.email);
      console.log('  - phoneNumber:', !!personalInfo.phoneNumber);
      console.log('  - dateOfBirth:', !!personalInfo.dateOfBirth);
      console.log('  - address:', !!personalInfo.address);
      console.log('  - streetNumber:', !!personalInfo.streetNumber);
      console.log('  - selectedCountry:', !!personalInfo.selectedCountry);
      console.log(
        '🔍 [KYC CHECK] Final result:',
        isComplete ? '✅ KYC Complete' : '❌ KYC Incomplete',
      );
      console.log('🔍 [KYC CHECK] ========================================');

      return isComplete;
    } catch (error) {
      console.error('🔍 [KYC CHECK] ❌ Error checking KYC status:', error);
      return false;
    }
  };

  // Prefetch app config as soon as QueryClient is available
  useEffect(() => {
    if (walletState === 'unlocked') {
      prefetchAppConfig(queryClient);
    }
  }, [queryClient, walletState]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (walletState === 'loading') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (walletState === 'welcome') {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <OnboardingCarousel
              onComplete={() => setWalletState('no_wallet')}
            />
          </AlertProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (walletState === 'dev_startup') {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <DevStartupScreen
              hasExistingWallet={hasExistingWallet}
              onCreateWallet={() => setWalletState('welcome')}
              onEnterApp={() => {
                if (hasExistingWallet) {
                  setWalletState('locked');
                } else {
                  setWalletState('welcome');
                }
              }}
            />
          </AlertProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (walletState === 'no_wallet') {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <SetupWalletScreen
              onWalletSetupComplete={async () => {
                // Small delay to allow success screen to be visible and prevent layout shift
                setTimeout(async () => {
                  // Simply unlock the wallet after setup
                  // KYC will be checked when user tries to access features that require it
                  setWalletState('unlocked');

                  // Trigger authentication after wallet setup
                  try {
                    await AuthService.authenticate();
                  } catch (error) {
                    console.error(
                      'Authentication failed after wallet setup:',
                      error,
                    );
                  }
                }, 1000); // 1 second delay
              }}
            />
          </AlertProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (walletState === 'locked') {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <EnterPinScreen
              onWalletUnlocked={async () => {
                // Simply unlock the wallet - don't force KYC flow here
                // KYC will be checked when user tries to access features that require it
                setWalletState('unlocked');

                // Trigger authentication after wallet unlock
                try {
                  await AuthService.authenticate();
                } catch (error) {
                  console.error(
                    'Authentication failed after wallet unlock:',
                    error,
                  );
                }
              }}
              publicKey={storedPublicKey}
            />
          </AlertProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  if (walletState === 'kyc_pending') {
    // Don't render KYCScreen directly - use the Stack and navigate to it
    // This prevents the navigation context from being lost
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlertProvider>
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.backgroundDark },
                }}
              >
                <Stack.Screen
                  name="settings/kyc"
                  options={{ headerShown: false }}
                  initialParams={{
                    onComplete: () => {
                      // After KYC is complete, move to unlocked state
                      setWalletState('unlocked');
                    },
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </AlertProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AlertProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.backgroundDark },
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{ title: 'Oops!' }}
                  />
                  <Stack.Screen
                    name="transaction/send"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="transaction/receive"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="wallet/SetupWalletScreen"
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="token/[address]"
                    options={{ animation: 'slide_from_right' }}
                  />
                </Stack>
                <StatusBar
                  style="light"
                  translucent
                  backgroundColor="transparent"
                />
              </BottomSheetModalProvider>
            </QueryClientProvider>
          </ToastProvider>
        </AlertProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: colors.backgroundDark,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
  },
});
