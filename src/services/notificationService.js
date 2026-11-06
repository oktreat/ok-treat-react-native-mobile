import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/storage';

let badgeRevision = 0;

// Always use the server total, not the first page of the notification list.
// Ignore old requests after logout or a newer refresh.
export const syncNotificationBadge = async () => {
  if (Platform.OS === 'web') return;
  const revision = ++badgeRevision;
  try {
    const authToken = await getAuthToken();
    if (revision !== badgeRevision) return;
    if (!authToken) {
      await Notifications.setBadgeCountAsync(0);
      return;
    }
    const response = await axios.get(
      `${API_BASE_URL}/api/notifications/unread-count`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const count = response.data?.data?.unreadCount;
    if (revision === badgeRevision && authToken === await getAuthToken() &&
        Number.isSafeInteger(count) && count >= 0) {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch {
    // A failed refresh must not clear a valid badge.
  }
};

export const initializeNotifications = async () => {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
};

/**
 * Request notification permission, fetch a native push token for this
 * device, and POST it to the backend so the server can target push
 * notifications to this user. Safe to call multiple times — backend
 * just overwrites with the latest token.
 *
 * Returns the token string on success, null otherwise.
 */
export const registerForPushNotifications = async () => {
  try {
    // Android channel for high-priority pushes. `sound` references the
    // bundled raw resource at android/app/src/main/res/raw/notification.mp3
    // (filename without extension).
    //
    // NOTE: Android does NOT allow modifying a channel's sound after the
    // channel exists on a device. We use a versioned channel ID so adding
    // / changing the sound takes effect on the next app launch without
    // requiring users to uninstall + reinstall. Bump the version suffix
    // whenever the channel's audio changes.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('oktreat-default-v3', {
        name: 'OkTreat Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#32A6D8',
        sound: 'notification',
      }).catch(() => {});
    }

    // Android 13 needs a channel before requesting notification permission.
    // Preserve existing channels and the user's system sound preferences.
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // Native FCM token on Android; native APNs token on iOS. The backend must
    // route each to its matching provider — APNs tokens cannot be sent to FCM.
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    const token = tokenResp?.data;
    if (!token) return null;

    // Sync to backend. Best-effort — a failure here just means the user
    // doesn't receive push on this device until next login.
    try {
      const authToken = await getAuthToken();
      if (authToken) {
        await axios.put(
          `${API_BASE_URL}/api/auth/push-token`,
          { pushToken: token },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Push token sync failed:', e?.response?.status || e?.message);
    }

    await syncNotificationBadge();
    return token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('registerForPushNotifications error:', error?.message || error);
    return null;
  }
};

/**
 * Clear the push token on the server (e.g., on logout) so the device
 * stops receiving pushes for the previous user.
 */
export const clearPushTokenOnServer = async () => {
  ++badgeRevision;
  if (Platform.OS !== 'web') await Notifications.setBadgeCountAsync(0).catch(() => {});
  try {
    const authToken = await getAuthToken();
    if (!authToken) return;
    await axios.put(
      `${API_BASE_URL}/api/auth/push-token`,
      { pushToken: null },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('clearPushTokenOnServer failed:', e?.response?.status || e?.message);
  }
};
