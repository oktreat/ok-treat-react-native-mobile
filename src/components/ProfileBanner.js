import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import api from '../config/api';
import ProfileCoverEditor from './ProfileCoverEditor';

export default function ProfileBanner() {
  const [cover, setCover] = useState(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    api.get('/users/cover', { timeout: 15000 }).then(response => {
      if (active && response.data?.success) { setCover(response.data.data.coverImage); setError(''); }
    }).catch(() => { if (active) setError('Could not load banner. You can still choose a new photo.'); });
    return () => { active = false; };
  }, []));
  return <View style={styles.section}>
    <View style={styles.banner}>
      {cover ? <Image key={cover} source={{ uri: cover }} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessibilityLabel="Your profile banner" /> : <View style={styles.empty}><Icon name="image-outline" size={32} color="#517584" /><Text style={styles.hint}>Your profile banner</Text></View>}
      <ProfileCoverEditor endpoint="/users/cover" onSaved={url => { setCover(url); setError(''); }} />
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({ section: { marginBottom: 20 }, banner: { width: '100%', aspectRatio: 2, backgroundColor: '#EAF3F6', borderRadius: 20, overflow: 'hidden' }, empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 36 }, hint: { fontSize: 14, color: '#517584' }, error: { color: '#7A4036', fontSize: 12, marginTop: 8 } });
