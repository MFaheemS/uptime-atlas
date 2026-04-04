import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from './api';

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications require a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Push notification permission denied');
    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    const platform = Device.osName === 'iOS' ? 'ios' : 'android';
    await api.post('/device-tokens', { token, platform });
  } catch (err) {
    console.error('[notifications] Failed to register push token', err);
  }
}
