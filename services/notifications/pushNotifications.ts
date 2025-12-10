import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMasterWalletKeypair } from '../walletUtils';
import bs58 from 'bs58';
import { signAsync } from '@noble/ed25519';

const BASE_BACKEND_URL = process.env.EXPO_PUBLIC_BASE_BACKEND_URL;

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('📝 Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('✅ Permission request result:', status);
  }

  if (finalStatus !== 'granted') {
    console.error('❌ Push notification permissions denied!');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    return token;
  } catch (error) {
    console.error('❌ Error getting push token:', error);

    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      });
    }
    return null;
  }
}

/**
 * Register push token with backend for server-sent notifications
 * This allows the backend to send notifications even when app is closed
 */
export async function registerPushTokenWithBackend(
  pushToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const wallet = await getMasterWalletKeypair();

    if (!wallet) {
      return {
        success: false,
        error: 'Wallet not initialized',
      };
    }

    const publicKey = wallet.publicKey.toBase58();
    const timestamp = Date.now();

    // Create signature for authentication
    const message = `Register push token at ${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const privateKey = wallet.secretKey.subarray(0, 32);
    const signature = await signAsync(messageBytes, privateKey);
    const signatureBase58 = bs58.encode(signature);

    const response = await fetch(`${BASE_BACKEND_URL}/registerPushToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey,
        pushToken,
        signature: signatureBase58,
        timestamp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        '❌ Failed to register push token with backend:',
        data.message,
      );
      return {
        success: false,
        error: data.message || 'Failed to register push token',
      };
    }

    console.log('✅ Push token registered with backend');
    return { success: true };
  } catch (error) {
    console.error('❌ Error registering push token with backend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get push token and register with backend in one call
 * Call this on app startup after wallet is initialized
 */
export async function initializePushNotifications(): Promise<string | null> {
  const pushToken = await registerForPushNotificationsAsync();

  if (pushToken) {
    // Register with backend asynchronously - don't block on it
    registerPushTokenWithBackend(pushToken).catch((error) => {
      console.error('Background push token registration failed:', error);
    });
  }

  return pushToken;
}
