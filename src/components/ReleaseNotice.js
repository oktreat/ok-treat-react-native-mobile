import { copy, useCopyUpdates } from '../i18n/copy';
import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import { APP_STORE_URL } from '../utils/appStoreLinks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
const STORE = APP_STORE_URL;
const newer = (a, b) => {
  const left = a.split('.').map(Number),
    right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if ((left[i] || 0) !== (right[i] || 0)) return (left[i] || 0) > (right[i] || 0);
  }
  return false;
};
export default function ReleaseNotice() {
  useCopyUpdates();
  const user = useSelector(state => state.auth.user);
  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        if (Platform.OS !== 'ios') return;
        const last = Number((await AsyncStorage.getItem('update-reminder-at')) || 0);
        if (Date.now() - last < 3 * 86400000) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        let data;
        try {
          data = await (await fetch('https://itunes.apple.com/lookup?id=6479255523', {
            signal: controller.signal
          })).json();
        } finally {
          clearTimeout(timeout);
        }
        // app.json can lag a signed native release. Compare the installed binary.
        const current = Application.nativeApplicationVersion;
        const available = data.results?.[0]?.version;
        if (live && current && available && /^\d+(\.\d+)*$/.test(available) && newer(available, current)) {
          await AsyncStorage.setItem('update-reminder-at', String(Date.now()));
          Alert.alert(copy('Update available'), copy('A newer OkTreat version is available.'), [{
            text: copy('Later'),
            style: 'cancel'
          }, {
            text: copy('Update'),
            onPress: () => Linking.openURL(STORE).catch(() => {})
          }]);
        }
      } catch {/* Offline: keep the app usable. */}
    })();
    return () => {
      live = false;
    };
  }, [!!user]);
  // Release notes belong in the store listing, not a blocking startup popup.
  return null;
}
