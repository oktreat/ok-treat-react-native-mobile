import { copy, useCopyUpdates } from '../i18n/copy';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as Application from 'expo-application';
import { APP_STORE_URL } from '../utils/appStoreLinks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
const STORE = APP_STORE_URL;
const release = '2.2.1-pals-and-app-fixes';
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
  const [show, setShow] = useState(false);
  const key = `whats-new:${user?.id || user?.email || 'member'}:${release}`;
  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        if (!(await AsyncStorage.getItem(key))) {
          if (live) setShow(true);
          return;
        }
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
  }, [key, !!user]);
  return <Modal visible={!!user && show} transparent animationType="fade" onRequestClose={() => {
    setShow(false);
    AsyncStorage.setItem(key, '1').catch(() => {});
  }}><View style={{
      flex: 1,
      justifyContent: 'center',
      padding: 28,
      backgroundColor: '#102A4377'
    }}><View style={{
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 22,
        gap: 16
      }}><Text style={{
          fontSize: 23,
          color: '#173342',
          fontWeight: '700'
        }}>{copy("What’s new")}</Text>{['Find pet care with AI sitter matching, then chat before booking.', 'Save PALS photos and travel plans, discover fellow solo travellers, and send activity invitations.', 'Manage your notification preferences and contact OkTreat Care from the app.'].map(paragraph => <Text key={paragraph} style={{
          color: '#365463',
          lineHeight: 24
        }}>{copy(paragraph)}</Text>)}
<Text style={{
          color: '#486371',
          fontSize: 13,
          lineHeight: 20
        }}>{copy("PALS invitations and chat require live identity checks. A photo is face-matched only when it carries the Photo matched label.")}</Text><TouchableOpacity accessibilityRole="button" onPress={() => {
          setShow(false);
          AsyncStorage.setItem(key, '1').catch(() => {});
        }} style={{
          backgroundColor: '#087EA4',
          padding: 15,
          borderRadius: 14
        }}><Text style={{
            color: 'white',
            textAlign: 'center',
            fontWeight: '700'
          }}>{copy("Let’s explore")}</Text></TouchableOpacity></View></View></Modal>;
}
