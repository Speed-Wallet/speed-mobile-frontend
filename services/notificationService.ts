import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { StorageService, PaymentCard } from '@/utils/storage';
import { getCardDetails } from './apis';
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
 * Handle card created notification by fetching full details and updating storage
 */
async function handleCardCreatedNotification(cardCode: string, cardData?: VirtualCardEventData) {
  try {
    console.log('🎯 Handling card created notification for cardCode:', cardCode);
    console.log('📋 Card data received:', cardData);
    
    // For development mode, we can use the cardData directly if available
    if (cardData && process.env.EXPO_PUBLIC_APP_ENV === 'development') {
      console.log('🚧 DEV MODE: Using cardData directly');
      
      // Convert cardData to PaymentCard format
      const newCard: PaymentCard = {
        id: cardData.cardCode,
        type: 'virtual',
        brand: cardData.CardBrand.toLowerCase() as 'mastercard' | 'visa',
        last4: cardData.Last4,
        holder: cardData.CardName,
        expires: cardData.ValidMonthYear, // Format like "12/27"
        balance: cardData.CardBalance,
      };
      
      console.log('✅ New card converted from notification data:', newCard);
      
      // Load existing cards
      const existingCards = await StorageService.loadCards();
      
      // Check if card already exists (avoid duplicates)
      const cardExists = existingCards.some(card => card.id === newCard.id);
      if (cardExists) {
        console.log('Card already exists in storage, skipping...');
        return;
      }
      
      // Remove any loading cards and add the new real card
      // Loading cards typically have temporary IDs and isLoading: true
      console.log('📋 Existing cards before update:', existingCards);
      const nonLoadingCards = existingCards.filter(card => !card.isLoading);
      console.log('📋 Non-loading cards:', nonLoadingCards);
      const updatedCards = [...nonLoadingCards, newCard];
      console.log('📋 Updated cards with new card:', updatedCards);
      
      await StorageService.saveCards(updatedCards);
      
      console.log('💾 Card added to storage successfully, loading cards removed');
      
      // Show local notification with card details
      await showLocalNotification(
        '🎉 Virtual Card Ready!',
        `Your ${newCard.brand} card ending in ${newCard.last4} is ready to use!`,
        { type: 'card_ready', cardId: newCard.id }
      );
      
      return; // Exit early since we handled it with direct data
    }
    
    // Fetch full card details from the API
    const cardDetailsResponse = await getCardDetails(cardCode);
    
    if (!cardDetailsResponse.success || !cardDetailsResponse.data) {
      console.error('Failed to fetch card details:', cardDetailsResponse.error);
      return;
    }
    
    // Convert to PaymentCard format
    const newCard = convertToPaymentCard(cardDetailsResponse.data);
    console.log('✅ New card converted:', newCard);
    
    // Load existing cards
    const existingCards = await StorageService.loadCards();
    
    // Check if card already exists (avoid duplicates)
    const cardExists = existingCards.some(card => card.id === newCard.id);
    if (cardExists) {
      console.log('Card already exists in storage, skipping...');
      return;
    }
    
    // Remove any loading cards and add the new real card
    // Loading cards typically have temporary IDs and isLoading: true
    const nonLoadingCards = existingCards.filter(card => !card.isLoading);
    const updatedCards = [...nonLoadingCards, newCard];
    
    await StorageService.saveCards(updatedCards);
    
    console.log('💾 Card added to storage successfully, loading cards removed');
    
    // Show local notification with card details
    await showLocalNotification(
      '🎉 Virtual Card Ready!',
      `Your ${newCard.brand} card ending in ${newCard.last4} is ready to use!`,
      { type: 'card_ready', cardId: newCard.id }
    );
    
  } catch (error) {
    console.error('Error handling card created notification:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners() {
  console.log('🔔 Setting up notification listeners...');
  
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification);
    console.log('📋 Notification data:', notification.request.content.data);
    
    const data = notification.request.content.data as unknown as NotificationData | undefined;
    console.log('🔍 Parsed notification data:', data);
    
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
