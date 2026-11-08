import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Opted in only by the diagnostic TestFlight workflow. No remote telemetry.
export const PUSH_DIAGNOSTICS = Platform.OS === 'ios' &&
  process.env.EXPO_PUBLIC_PUSH_DIAGNOSTICS === 'true';
const KEY = 'oktreat.push-sound-diagnostics.v1';
let queue = Promise.resolve();
let revision = 0;

// Never retain message text, account IDs, tokens, or the full APNs payload.
export function notificationSoundSummary(notification, source) {
  const trigger = notification?.request?.trigger;
  const aps = trigger?.payload?.aps;
  const sound = aps?.sound ?? notification?.request?.content?.sound;
  const nativeSound = notification?.request?.content?.sound;
  return {
    source,
    capturedAt: new Date().toISOString(),
    deliveredAt: typeof notification?.date === 'number' ? notification.date : null,
    trigger: trigger?.type === 'push' ? 'push' : 'local-or-unknown',
    sound: sound === 'default' ? 'default' :
      sound == null ? 'not exposed' : sound === false || sound === '' ? 'none' : 'custom',
    apsSoundPresent: aps ? Object.prototype.hasOwnProperty.call(aps, 'sound') : null,
    nativeSound: ['default', 'defaultCritical', 'custom'].includes(nativeSound) ? nativeSound :
      nativeSound === null ? 'none' : 'not exposed',
    interruptionLevel: ['passive', 'active', 'timeSensitive', 'critical'].includes(notification?.request?.content?.interruptionLevel)
      ? notification.request.content.interruptionLevel : 'not exposed',
  };
}

export function recordPushDiagnostic(notification, source = 'received') {
  if (!PUSH_DIAGNOSTICS) return Promise.resolve();
  const entry = notificationSoundSummary(notification, source);
  const atRevision = revision;
  queue = queue.catch(() => {}).then(async () => {
    if (atRevision !== revision) return;
    const saved = JSON.parse(await AsyncStorage.getItem(KEY) || '[]');
    const entries = Array.isArray(saved) ? saved : [];
    await AsyncStorage.setItem(KEY, JSON.stringify([...entries, entry].slice(-20)));
  }).catch(() => {});
  return queue;
}

export async function clearPushDiagnostics() {
  ++revision;
  await queue.catch(() => {});
  await AsyncStorage.removeItem(KEY);
}

export async function getPushDiagnostics() {
  if (!PUSH_DIAGNOSTICS) return null;
  const permissions = await Notifications.getPermissionsAsync();
  const presented = await Notifications.getPresentedNotificationsAsync();
  await queue;
  const ios = permissions.ios || {};
  return {
    checkedAt: new Date().toISOString(),
    status: permissions.status,
    iosStatus: ios.status ?? null,
    allowsSound: ios.allowsSound ?? null,
    allowsAlert: ios.allowsAlert ?? null,
    allowsBadge: ios.allowsBadge ?? null,
    captured: JSON.parse(await AsyncStorage.getItem(KEY) || '[]'),
    presented: presented.slice(-10).map(n => notificationSoundSummary(n, 'notification-centre')),
  };
}

export async function scheduleSoundDiagnostic() {
  if (!PUSH_DIAGNOSTICS) return;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'OkTreat sound test',
      body: 'Local notification test. Note whether you heard a sound.',
      sound: 'notification.wav',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, repeats: false },
  });
}
