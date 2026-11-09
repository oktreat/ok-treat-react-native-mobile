import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
const STORE = 'https://apps.apple.com/app/id6479255523';
const release = '2.1.0';
const newer = (a, b) => {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if ((left[i] || 0) !== (right[i] || 0)) return (left[i] || 0) > (right[i] || 0);
  }
  return false;
};
export default function ReleaseNotice() {
  const user = useSelector(state => state.auth.user);
  const [show, setShow] = useState(false);
  const key = `whats-new:${user?.id || user?.email || 'member'}:${release}`;
  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        if (!(await AsyncStorage.getItem(key))) { if (live) setShow(true); return; }
        if (Platform.OS !== 'ios') return;
        const last = Number(await AsyncStorage.getItem('update-reminder-at') || 0);
        if (Date.now() - last < 3 * 86400000) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        let data;
        try { data = await (await fetch('https://itunes.apple.com/lookup?id=6479255523', { signal: controller.signal })).json(); }
        finally { clearTimeout(timeout); }
        const current = Constants.nativeAppVersion || Constants.expoConfig?.version;
        const available = data.results?.[0]?.version;
        if (live && current && available && /^\d+(\.\d+)*$/.test(available) && newer(available, current)) {
          await AsyncStorage.setItem('update-reminder-at', String(Date.now()));
          Alert.alert('Update available', 'A newer OkTreat version is available.', [{ text: 'Later', style: 'cancel' }, { text: 'Update', onPress: () => Linking.openURL(STORE).catch(() => {}) }]);
        }
      } catch { /* Offline: keep the app usable. */ }
    })();
    return () => { live = false; };
  }, [key, !!user]);
  return <Modal visible={!!user && show} transparent animationType="fade" onRequestClose={() => { setShow(false); AsyncStorage.setItem(key, '1').catch(() => {}); }}><View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#102A4377' }}><View style={{ backgroundColor: 'white', padding: 24, borderRadius: 22, gap: 16 }}><Text style={{ fontSize: 23, color: '#173342', fontWeight: '700' }}>What’s new</Text>{[
  'Find and offer pet care more easily from your refreshed home page.',
  'Discover Pals: meet locals and share activities, at home or while travelling.',
  'Enjoy a fresh TreatCoins look and gentle coin animations.',
].map(paragraph => <Text key={paragraph} style={{ color: '#365463', lineHeight: 24 }}>{paragraph}</Text>)}
<Text style={{ color: '#486371', fontSize: 13, lineHeight: 20 }}>Pals is a preview with fictional profiles. Invitations and reports are not sent.</Text><TouchableOpacity accessibilityRole="button" onPress={() => { setShow(false); AsyncStorage.setItem(key, '1').catch(() => {}); }} style={{ backgroundColor: '#087EA4', padding: 15, borderRadius: 14 }}><Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Let’s explore</Text></TouchableOpacity></View></View></Modal>;
}
