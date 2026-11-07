import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/Ionicons';
import api from '../config/api';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../config/cloudinary';
import { coverCrop, coverUrl } from '../utils/coverCrop';

export default function ProfileCoverEditor({ onSaved, endpoint = '/sitter/profile/cover' }) {
  const [photo, setPhoto] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);
  const [width, setWidth] = useState(300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const lock = useRef(false);
  const uploaded = useRef(null);
  const choose = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.9 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      coverCrop(asset.width, asset.height);
      setPhoto(asset); setZoom(1); setX(0.5); setY(0.5); setError(''); uploaded.current = null;
    } catch { setError('Could not open that photo. Please try another image.'); }
  };
  const save = async () => {
    if (!photo || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = uploaded.current || await uploadToCloudinary(photo.uri, CLOUDINARY_FOLDERS.SITTERS);
      uploaded.current = result;
      const crop = coverCrop(result.width, result.height, zoom, x, y);
      const url = coverUrl(result.url, crop);
      if (!await Image.prefetch(url)) throw new Error('The cropped image could not be loaded. Please try again.');
      const response = await api.put(endpoint, { coverPhoto: url }, { timeout: 20000 });
      if (!response.data?.success) throw new Error('Could not save your cover photo.');
      onSaved(response.data.data.coverImage); setOpen(false); setPhoto(null);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Could not save. Your current banner is unchanged.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const crop = photo ? coverCrop(photo.width, photo.height, zoom, x, y) : null;
  const factor = crop ? width / crop.width : 1;
  const control = (label, press) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={press} style={styles.control}><Text style={styles.controlText}>{label}</Text></TouchableOpacity>;
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change cover photo" onPress={() => { setOpen(true); setError(''); }} style={styles.camera}><Icon name="camera" size={20} color="#FFF" /><Text style={styles.cameraText}>Edit cover</Text></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => { if (!busy) setOpen(false); }}>
      <SafeAreaView style={{flex: 1, backgroundColor: "#FFF"}}><ScrollView contentContainerStyle={styles.page}><View style={styles.header}><Text style={styles.title}>Change cover photo</Text>{control('Cancel', () => setOpen(false))}</View>
        <Text style={styles.hint}>Choose a photo, then adjust the crop. Your profile picture and gallery stay the same.</Text>
        {photo && <View accessibilityLabel="Cover photo preview" onLayout={e => setWidth(e.nativeEvent.layout.width)} style={styles.preview}><Image source={{ uri: photo.uri }} style={{ position: 'absolute', width: photo.width * factor, height: photo.height * factor, left: -crop.x * factor, top: -crop.y * factor }} resizeMode="stretch" /></View>}
        {!photo && <View style={styles.empty}><Icon name="image-outline" size={48} color="#536777" /><Text style={styles.hint}>Your new banner will appear here.</Text></View>}
        {control(photo ? 'Choose another photo' : 'Choose photo', choose)}
        {photo && <><View style={styles.row}>{control('Zoom out', () => setZoom(v => Math.max(1, v - 0.2)))}{control('Zoom in', () => setZoom(v => Math.min(3, v + 0.2)))}</View>
          <View style={styles.row}>{control('Left', () => setX(v => Math.max(0, v - 0.1)))}{control('Right', () => setX(v => Math.min(1, v + 0.1)))}{control('Up', () => setY(v => Math.max(0, v - 0.1)))}{control('Down', () => setY(v => Math.min(1, v + 0.1)))}</View></>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {busy ? <ActivityIndicator accessibilityLabel="Saving cover photo" color="#08779D" /> : photo && <TouchableOpacity accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>Save cover photo</Text></TouchableOpacity>}
      </ScrollView></SafeAreaView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({ camera: { position: 'absolute', right: 12, top: 12, borderRadius: 20, backgroundColor: '#173747', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, cameraText: { color: '#FFF', fontWeight: '600', fontSize: 12 }, page: { flexGrow: 1, padding: 20, gap: 18, backgroundColor: '#FFF' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: '#182A39', fontSize: 21, fontWeight: '600' }, hint: { color: '#536777', fontSize: 15, lineHeight: 23 }, preview: { width: '100%', aspectRatio: 2, overflow: 'hidden', borderRadius: 16, backgroundColor: '#E9EEF2' }, empty: { aspectRatio: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF3F6', borderRadius: 16 }, row: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }, control: { padding: 12, borderRadius: 12, backgroundColor: '#EAF4F8', alignItems: 'center' }, controlText: { color: '#075B78', fontSize: 14, fontWeight: '600' }, error: { color: '#A13222', lineHeight: 22 }, save: { padding: 16, alignItems: 'center', borderRadius: 14, backgroundColor: '#08779D' }, saveText: { color: '#FFF', fontWeight: '600', fontSize: 16 } });
