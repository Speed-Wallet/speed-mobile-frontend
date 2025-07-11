import * as Notifications from 'expo-notifications';
import { Platform, Alert, ToastAndroid } from 'react-native';
import { router } from 'expo-router';
import type { NotificationData, VirtualCardEventData } from '@/types/notifications';

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
 * Show a simple toast notification (works better than complex toast libraries)
 */
export function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, use local notification as a fallback
    showLocalNotification('💰 USDT Received!', message);
  }
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('🔔 Starting push token registration...');
  console.log('📱 Platform:', Platform.OS);
  
  if (Platform.OS === 'android') {
    console.log('🤖 Setting up Android notification channel...');
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  console.log('🔑 Checking notification permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('📋 Existing permission status:', existingStatus);
  
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
    console.log('🎯 Getting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log('✅ Expo push token obtained:', token);
    return token;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return null;
  }
}

/**
 * Convert API card details to PaymentCard format
 */
// Function no longer needed since we use API-based card loading
// function convertToPaymentCard(cardDetails: any): PaymentCard {
//   // This function has been deprecated in favor of convertApiCardToPaymentCard in apis.ts
// }

/**
 * Handle card created notification by routing to dev or prod handlers
 */
async function handleCardCreatedNotification(cardCode: string, cardData?: VirtualCardEventData) {
  try {
    console.log('🎯 Handling card created notification for cardCode:', cardCode);
    console.log('📋 Card data received:', cardData);

    // Since we're using API-based card loading, we don't need to manually update storage
    // The cards will be refreshed via the callback in setupNotificationListeners
    console.log('✅ Card created notification processed. Cards will be refreshed from API.');
  } catch (error) {
    console.error('Error handling card created notification:', error);
  }
}

/**
 * Convert notification cardData to PaymentCard format
 */
// Function no longer needed since we use API-based card loading
// function convertCardDataToPaymentCard(cardData: VirtualCardEventData): PaymentCard {
//   // This function has been deprecated in favor of convertApiCardToPaymentCard in apis.ts
// }

/**
 * Replace loading card with new card in storage
 */
// Function no longer needed since we use API-based card loading
// async function replaceLoadingCardWithNewCard(newCard: PaymentCard) {
//   // This function has been deprecated in favor of API-based card refresh
// }

/**
 * Handle card creation failed notification by updating loading cards to failed state
 */
async function handleCardCreationFailedNotification(error: string, eventData?: any) {
  try {
    console.log('❌ Handling card creation failed notification:', error);
    console.log('📋 Event data received:', eventData);
    
    // Since we're using API-based card loading, we don't need to manually update storage
    // The cards will be refreshed via the callback in setupNotificationListeners
    console.log('❌ Card creation failed notification processed. Cards will be refreshed from API.');
    
    // Show alert with error message
    setTimeout(() => {
      Alert.alert(
        'Card Creation Failed',
        `Failed to create your virtual card: ${error}`,
        [
          {
            text: 'Try Again',
            onPress: () => router.push('/transaction/cards'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
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
  console.log('🔔 Setting up notification listeners...');
  
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    const data = notification.request.content.data as unknown as NotificationData | undefined;
    console.log('🔍 Parsed notification data:', data);
    
    // Handle USDT received notifications with toast
    if (data?.type === 'usdt_received') {
      console.log('💰 USDT received notification received');
      const amount = data.eventData?.amount || 'Unknown';
      showToast(`💰 ${amount} USDT received! Creating card...`);
    }
    
    // Handle card created notifications immediately
    if (data?.type === 'card_created') {
      console.log('💳 Card created notification received in foreground');
      if (data.cardCode) {
        handleCardCreatedNotification(data.cardCode, data.cardData);
        // Call the callback to refresh cards
        onCardsUpdated?.();
      }
    }
    
    // Handle card creation failed notifications immediately
    if (data?.type === 'card_creation_failed') {
      console.log('❌ Card creation failed notification received');
      handleCardCreationFailedNotification(data.error || 'Unknown error', data);
      // Call the callback to refresh cards
      onCardsUpdated?.();
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification response:', response);
    
    const data = response.notification.request.content.data as unknown as NotificationData | undefined;
    
    if (data?.type === 'usdt_received') {
      console.log('💰 USDT received notification tapped');
      // Navigate to cards screen
      router.push('/transaction/cards');
    } else if (data?.type === 'card_created') {
      console.log('💳 Card created notification tapped');
      // If we haven't handled it yet, handle it now
      if (data.cardCode) {
        handleCardCreatedNotification(data.cardCode, data.cardData);
        // Call the callback to refresh cards
        onCardsUpdated?.();
      }
      // Navigate to cards screen to show new card
      router.push('/transaction/cards');
    } else if (data?.type === 'card_creation_failed') {
      console.log('❌ Card creation failed notification tapped');
      // Handle the failed notification if not already handled
      if (data.error) {
        handleCardCreationFailedNotification(data.error, data);
        // Call the callback to refresh cards
        onCardsUpdated?.();
      }
      // Navigate to cards screen where user can try again
      router.push('/transaction/cards');
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Show a local notification (for testing or immediate feedback)
 */
export async function showLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });
}
