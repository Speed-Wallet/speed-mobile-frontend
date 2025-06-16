import * as Notifications from 'expo-notifications';
import { Platform, Alert, ToastAndroid } from 'react-native';
import { router } from 'expo-router';
import { StorageService, PaymentCard } from '@/utils/storage';
import { getCard } from './apis';
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
function convertToPaymentCard(cardDetails: any): PaymentCard {
  return {
    id: cardDetails.code,
    type: 'virtual',
    brand: cardDetails.cardBrand.toLowerCase() as 'mastercard' | 'visa',
    last4: cardDetails.last4,
    holder: cardDetails.cardName,
    expires: cardDetails.validMonthYear, // Format like "12/27"
    balance: cardDetails.cardBalance,
  };
}

/**
 * Handle card created notification by routing to dev or prod handlers
 */
async function handleCardCreatedNotification(cardCode: string, cardData?: VirtualCardEventData) {
  try {
    console.log('🎯 Handling card created notification for cardCode:', cardCode);
    console.log('📋 Card data received:', cardData);

    let newCard: PaymentCard;

    if (cardData && process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      console.log('🚧 DEV MODE: Using cardData directly');
      newCard = convertCardDataToPaymentCard(cardData);
    } else {
      console.log('🏭 PROD MODE: Fetching card details from API');
      const cardDetailsResponse = await getCard(cardCode);
      if (!cardDetailsResponse.success || !cardDetailsResponse.data) {
        console.error('Failed to fetch card details:', cardDetailsResponse.error);
        return;
      }
      newCard = convertToPaymentCard(cardDetailsResponse.data);
    }

    await replaceLoadingCardWithNewCard(newCard);
  } catch (error) {
    console.error('Error handling card created notification:', error);
  }
}

/**
 * Convert notification cardData to PaymentCard format
 */
function convertCardDataToPaymentCard(cardData: VirtualCardEventData): PaymentCard {
  return {
    id: cardData.cardCode,
    type: 'virtual',
    brand: cardData.CardBrand.toLowerCase() as 'mastercard' | 'visa',
    last4: cardData.Last4,
    holder: cardData.CardName,
    expires: cardData.ValidMonthYear,
    balance: cardData.CardBalance,
  };
}

/**
 * Replace loading card with new card in storage
 */
async function replaceLoadingCardWithNewCard(newCard: PaymentCard) {
  console.log('✅ New card converted:', newCard);

  const existingCards = await StorageService.loadCards();
  
  // Check if card already exists (avoid duplicates)
  if (existingCards.some(card => card.id === newCard.id)) {
    console.log('Card already exists in storage, skipping...');
    return;
  }

  console.log('📋 Existing cards before update:', existingCards);
  
  // Find and replace the loading card with matching holder name
  const loadingCards = existingCards.filter(card => card.isLoading);
  
  if (loadingCards.length > 0) {
    console.log('🔍 Found loading cards:', loadingCards.map(c => ({ id: c.id, holder: c.holder })));
    
    // Find a loading card with matching holder name
    const targetLoadingCard = loadingCards.find(card => card.holder === newCard.holder);
    
    if (!targetLoadingCard) {
      const errorMsg = `❌ CRITICAL ERROR: No loading card found with matching holder name "${newCard.holder}". Available loading cards: ${loadingCards.map(c => c.holder).join(', ')}`;
      console.error(errorMsg);
      throw new Error(`Card creation notification received for "${newCard.holder}" but no matching loading card found. This indicates a serious data inconsistency.`);
    }
    
    console.log('🎯 Replacing loading card:', targetLoadingCard.id, 'with new card:', newCard.id);
    
    // Replace the specific loading card with the new card
    const updatedCards = existingCards.map(card => 
      card.id === targetLoadingCard.id ? newCard : card
    );
    
    console.log('📋 Updated cards with replaced card:', updatedCards.map(c => ({ id: c.id, holder: c.holder, isLoading: c.isLoading })));
    
    await StorageService.saveCards(updatedCards);
    console.log('💾 Loading card replaced successfully');
  } else {
    console.log('⚠️ No loading cards found, adding new card directly');
    const updatedCards = [...existingCards, newCard];
    await StorageService.saveCards(updatedCards);
    console.log('💾 New card added directly');
  }

  await showLocalNotification(
    '🎉 Virtual Card Ready!',
    `Your ${newCard.brand} card ending in ${newCard.last4} is ready to use!`,
    { type: 'card_ready', cardId: newCard.id }
  );
}

/**
 * Handle card creation failed notification by updating loading cards to failed state
 */
async function handleCardCreationFailedNotification(error: string, eventData?: any) {
  try {
    console.log('❌ Handling card creation failed notification:', error);
    console.log('📋 Event data received:', eventData);
    
    // Load existing cards
    const existingCards = await StorageService.loadCards();
    
    // Find loading cards and mark the most recent one as failed
    const loadingCards = existingCards.filter(card => card.isLoading);
    
    if (loadingCards.length > 0) {
      console.log('🔍 Found loading cards to mark as failed:', loadingCards);
      
      // Get the most recent loading card (highest timestamp ID)
      const mostRecentLoadingCard = loadingCards.reduce((latest, current) => {
        return parseInt(current.id) > parseInt(latest.id) ? current : latest;
      });
      
      // Update the cards array
      const updatedCards = existingCards.map(card => {
        if (card.id === mostRecentLoadingCard.id) {
          return {
            ...card,
            isLoading: false,
            isFailed: true,
            failureReason: error,
            last4: 'FAIL', // Show FAIL instead of card number
            expires: '••/••' // Keep expiry hidden for failed cards
          };
        }
        return card;
      });
      
      await StorageService.saveCards(updatedCards);
      console.log('💾 Updated failed card in storage');
      
      // Show alert with error message
      setTimeout(() => {
        Alert.alert(
          'Card Creation Failed',
          `Failed to create your virtual card: ${error}`,
          [
            {
              text: 'Try Again',
              onPress: () => router.push('/wallet/cards'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }, 1000); // Delay to ensure the cards screen is visible
      
      // Show local notification with error details
      await showLocalNotification(
        '❌ Card Creation Failed',
        `Failed to create your virtual card: ${error}`,
        { type: 'card_failed', error }
      );
    } else {
      console.log('⚠️ No loading cards found to mark as failed');
    }
    
  } catch (error) {
    console.error('Error handling card creation failed notification:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners() {
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
      }
    }
    
    // Handle card creation failed notifications immediately
    if (data?.type === 'card_creation_failed') {
      console.log('❌ Card creation failed notification received');
      handleCardCreationFailedNotification(data.error || 'Unknown error', data);
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification response:', response);
    
    const data = response.notification.request.content.data as unknown as NotificationData | undefined;
    
    if (data?.type === 'usdt_received') {
      console.log('💰 USDT received notification tapped');
      // Navigate to cards screen
      router.push('/wallet/cards');
    } else if (data?.type === 'card_created') {
      console.log('💳 Card created notification tapped');
      // If we haven't handled it yet, handle it now
      if (data.cardCode) {
        handleCardCreatedNotification(data.cardCode, data.cardData);
      }
      // Navigate to cards screen to show new card
      router.push('/wallet/cards');
    } else if (data?.type === 'card_creation_failed') {
      console.log('❌ Card creation failed notification tapped');
      // Handle the failed notification if not already handled
      if (data.error) {
        handleCardCreationFailedNotification(data.error, data);
      }
      // Navigate to cards screen where user can try again
      router.push('/wallet/cards');
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
