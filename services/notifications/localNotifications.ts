import * as Notifications from 'expo-notifications';

/**
 * Show a local notification (can be used for iOS fallback or general notifications)
 */
export async function showLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
}
