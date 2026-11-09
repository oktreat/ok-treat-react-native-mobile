import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Local-only gallery, intentionally separate from the OkTreat account avatar.
// No verification selfie is captured or represented as a biometric check here.
export default function PalsPhotosPreview({ accountKey }) {
  const [photos, setPhotos] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = useRef(false);
  const location = useRef(null);
  const operation = useRef(false);
  useEffect(() => {
    live.current = true; setReady(false); setPhotos([]);
    let current = true;
    (async () => {
      try {
        const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, accountKey);
        const directory = `${FileSystem.documentDirectory}pals-photos/${hash}/`;
        const key = `pals-photos-preview:${hash}`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        const raw = JSON.parse(await AsyncStorage.getItem(key) || '[]');
        const files = Array.isArray(raw) ? raw.filter(name => /^photo-[a-z0-9-]+\.jpg$/.test(name)).slice(0, 5) : [];
        const existing = [];
        for (const name of files) if ((await FileSystem.getInfoAsync(directory + name)).exists) existing.push(name);
        if (current) { location.current = { directory, key }; setPhotos(existing); setReady(true); }
      } catch { if (current) Alert.alert('Photos unavailable', 'Please reopen this page to try again.'); }
    })();
    return () => { current = false; live.current = false; location.current = null; };
  }, [accountKey]);
  const persist = async next => {
    await AsyncStorage.setItem(location.current.key, JSON.stringify(next));
    if (live.current) setPhotos(next);
  };
  const remove = async index => {
    if (!ready || operation.current || !location.current) return;
    operation.current = true; setBusy(true);
    try {
      const uri = location.current.directory + photos[index];
      await persist(photos.filter((_, i) => i !== index));
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch { Alert.alert('Could not remove photo', 'Please try again.'); }
    finally { operation.current = false; if (live.current) setBusy(false); }
  };
  const pick = async (camera, replace = null) => {
    if (!ready || operation.current || !location.current || (replace === null && photos.length >= 5)) return;
    operation.current = true; setBusy(true);
    const target = location.current;
    let copied = null;
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        Alert.alert('Camera permission needed', 'Allow camera access in Settings, or choose a photo from your library.'); return;
      }
      const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0] || !live.current || location.current !== target) return;
      const name = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      copied = target.directory + name;
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: copied });
      const next = [...photos]; const old = replace === null ? null : next[replace];
      if (replace === null) next.push(name); else next[replace] = name;
      await persist(next); copied = null;
      if (old) await FileSystem.deleteAsync(target.directory + old, { idempotent: true });
    } catch {
      if (copied) await FileSystem.deleteAsync(copied, { idempotent: true }).catch(() => {});
      Alert.alert('Could not add photo', 'Please try another photo.');
    } finally { operation.current = false; if (live.current) setBusy(false); }
  };
  const choose = (index = null) => Alert.alert(index === null ? 'Add a Pals photo' : 'Change Pals photo', 'Choose a recent real-life photo of yourself.', [
    { text: 'Take photo', onPress: () => pick(true, index) },
    { text: 'Choose from library', onPress: () => pick(false, index) },
    { text: 'Cancel', style: 'cancel' },
  ]);
  const action = (label, onPress) => <TouchableOpacity accessibilityRole="button" disabled={!ready || busy} onPress={onPress} style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#087EA4', fontWeight: '700' }}>{label}</Text></TouchableOpacity>;
  return <View style={{ gap: 12 }}>
    <Text style={{ fontSize: 18, fontWeight: '800', color: '#173342' }}>Your Pals photos · {photos.length}/5</Text>
    <Text style={{ color: '#486371', lineHeight: 21 }}>Show others what you look like so they can recognise you when you meet. Use recent, real-life photos of yourself, with your face clearly visible in your main photo.</Text>
    <Text style={{ color: '#486371', lineHeight: 20 }}>These photos are separate from your OkTreat profile photo. Preview photos are saved only on this phone.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{photos.map((name, index) => <View key={name} style={{ width: '46%', borderWidth: 1, borderColor: '#CDDFE8', borderRadius: 14, overflow: 'hidden' }}>
      <Image accessibilityLabel={`Pals photo ${index + 1}${index === 0 ? ', main photo' : ''}`} source={{ uri: location.current?.directory + name }} style={{ width: '100%', aspectRatio: 1 }} />
      <Text style={{ color: '#173342', fontWeight: '700', padding: 8 }}>{index === 0 ? 'Main photo' : `Photo ${index + 1}`}</Text>
      {action('Change photo', () => choose(index))}
      {index > 0 && action('Make main photo', async () => { if (operation.current) return; operation.current = true; setBusy(true); try { await persist([name, ...photos.filter(p => p !== name)]); } catch { Alert.alert('Could not change main photo', 'Please try again.'); } finally { operation.current = false; if (live.current) setBusy(false); } })}
      {action('Remove', () => remove(index))}
    </View>)}</View>
    {photos.length < 5 && action(busy ? 'Adding photo…' : '＋ Add photo', () => choose())}
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: '#EEF6FA', gap: 6 }}><Text style={{ color: '#173342', fontWeight: '700' }}>Photo verification · not connected yet</Text><Text style={{ color: '#486371', lineHeight: 20 }}>The planned check compares your profile photo with a fresh camera selfie. Adding photos here does not verify them. No verification selfie is captured in this preview.</Text></View>
    {photos.length > 0 && action('Delete all Pals photos', () => Alert.alert('Delete all Pals photos?', 'This only removes your separate Pals preview photos.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { if (operation.current || !location.current) return; operation.current = true; setBusy(true); const target = location.current; try { await persist([]); for (const name of photos) await FileSystem.deleteAsync(target.directory + name, { idempotent: true }); } catch { Alert.alert('Could not delete all photos', 'Please try again.'); } finally { operation.current = false; if (live.current) setBusy(false); } } }]))}
  </View>;
}
