import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import type {
  NotificationData,
  VirtualCardEventData,
  USDTReceivedEventData,
} from '@/types/notifications';
import {
  handleUSDTReceived,
  handleCardCreationComplete,
  handleCardCreationFailed,
  handleKYCVerificationComplete,
  simulateKYCVerification,
} from '../../utils/cardCreationSteps';
import { showToast } from './toast';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowList: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

/**
 * Handle card created notification by routing to dev or prod handlers
 */
async function handleCardCreatedNotification(
  cardCode: string,
  cardData?: VirtualCardEventData,
) {
  try {
    console.log(
      '🎯 Handling card created notification for cardCode:',
      cardCode,
    );
    console.log('📋 Card data received:', cardData);

    // Since we're using API-based card loading, we don't need to manually update storage
    // The cards will be refreshed via the callback in setupNotificationListeners
    console.log(
      '✅ Card created notification processed. Cards will be refreshed from API.',
    );
  } catch (error) {
    console.error('Error handling card created notification:', error);
  }
}

/**
 * Handle card creation failed notification by updating loading cards to failed state
 */
async function handleCardCreationFailedNotification(
  error: string,
  eventData?: any,
) {
  try {
    console.log('❌ Handling card creation failed notification:', error);
    console.log('📋 Event data received:', eventData);

    // Since we're using API-based card loading, we don't need to manually update storage
    // The cards will be refreshed via the callback in setupNotificationListeners
    console.log(
      '❌ Card creation failed notification processed. Cards will be refreshed from API.',
    );

    // Show alert with error message
    setTimeout(() => {
      Alert.alert(
        'Card Creation Failed',
        `Failed to create your virtual card: ${error}`,
        [
          {
            text: 'Try Again',
            onPress: () => router.push('/(tabs)/spend'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ],
      );
    }, 1000); // Delay to ensure the cards screen is visible
  } catch (err) {
    console.error('Error handling card creation failed notification:', err);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(onCardsUpdated?: () => void) {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data as unknown as
        | NotificationData
        | undefined;
      console.log('🔍 Parsed notification data:', data);

      // Handle USDT received notifications with toast
      if (data?.type === 'usdt_received') {
        console.log('💰 USDT received notification received');
        const eventData = data.eventData as USDTReceivedEventData;
        const amount = eventData?.amount || 'Unknown';
        const hash = eventData?.hash;

        showToast(`💰 ${amount} USDT received! Creating card...`);

        // Update creation step and simulate KYC verification
        if (hash) {
          handleUSDTReceived(hash);
          simulateKYCVerification(hash, 3000); // Simulate KYC completion after 3 seconds
        }

        // Call the callback to refresh cards
        onCardsUpdated?.();
      }

      // Handle card created notifications immediately
      if (data?.type === 'card_created') {
        console.log('💳 Card created notification received in foreground');
        const hash = data.transactionSignature;

        if (data.cardCode) {
          handleCardCreatedNotification(data.cardCode, data.cardData);

          // Mark creation as complete
          if (hash) {
            handleCardCreationComplete(hash);
          }

          // Call the callback to refresh cards
          onCardsUpdated?.();
        }
      }

      // Handle card creation failed notifications immediately
      if (data?.type === 'card_creation_failed') {
        console.log('❌ Card creation failed notification received');
        const hash = data.transactionSignature;

        handleCardCreationFailedNotification(
          data.error || 'Unknown error',
          data,
        );

        // Mark creation as failed
        if (hash) {
          handleCardCreationFailed(hash);
        }

        // Call the callback to refresh cards
        onCardsUpdated?.();
      }

      // Handle KYC verified notifications
      if (data?.type === 'kyc_verified') {
        console.log('✅ KYC verified notification received');
        const hash = data.transactionSignature;

        showToast(`✅ KYC verified! Creating your card...`);

        // Advance creation step to card creation (step 3)
        if (hash) {
          handleKYCVerificationComplete(hash); // This advances to step 3
        }

        // Call the callback to refresh cards
        onCardsUpdated?.();
      }

      // Handle KYC failed notifications
      if (data?.type === 'kyc_failed') {
        console.log('❌ KYC verification failed notification received');
        const hash = data.transactionSignature;

        handleCardCreationFailedNotification(
          `KYC verification failed: ${data.error}`,
          data,
        );

        // Mark creation as failed
        if (hash) {
          handleCardCreationFailed(hash);
        }

        // Call the callback to refresh cards
        onCardsUpdated?.();
      }
    },
  );

  // Listener for when user taps on notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification response:', response);

      const data = response.notification.request.content.data as unknown as
        | NotificationData
        | undefined;

      if (data?.type === 'usdt_received') {
        console.log('💰 USDT received notification tapped');
        // Navigate to cards screen
        router.push('/(tabs)/spend');
      } else if (data?.type === 'card_created') {
        console.log('💳 Card created notification tapped');
        // If we haven't handled it yet, handle it now
        if (data.cardCode) {
          handleCardCreatedNotification(data.cardCode, data.cardData);
          // Call the callback to refresh cards
          onCardsUpdated?.();
        }
        // Navigate to cards screen to show new card
        router.push('/(tabs)/spend');
      } else if (data?.type === 'card_creation_failed') {
        console.log('❌ Card creation failed notification tapped');
        // Handle the failed notification if not already handled
        if (data.error) {
          handleCardCreationFailedNotification(data.error, data);
          // Call the callback to refresh cards
          onCardsUpdated?.();
        }
        // Navigate to cards screen where user can try again
        router.push('/(tabs)/spend');
      } else if (data?.type === 'kyc_verified') {
        console.log('✅ KYC verified notification tapped');
        // Navigate to cards screen to see progress
        router.push('/(tabs)/spend');
      } else if (data?.type === 'kyc_failed') {
        console.log('❌ KYC failed notification tapped');
        // Navigate to KYC screen to retry
        router.push('/settings/kyc');
      }
    });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
