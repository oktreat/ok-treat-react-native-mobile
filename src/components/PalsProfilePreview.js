import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

export default function PalsProfilePreview({ onClose }) {
  const user = useSelector(state => state.auth.user);
  const key = `pals-profile-preview:v1:${user?.id || user?.email || 'anonymous'}`;
  const empty = { bio: '', languages: '', interests: '', role: 'Local', city: '', visible: false, adult: false, rules: false };
  const [form, setForm] = useState(empty);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    setReady(false); setForm(empty);
    AsyncStorage.getItem(key).then(raw => {
      if (live && raw) { try { const value = JSON.parse(raw); setForm({ ...empty, ...value }); } catch {} }
    }).catch(() => {}).finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, [key]);
  const patch = (name, value) => setForm(old => ({ ...old, [name]: value }));
  const valid = ready && form.bio.trim() && form.languages.trim() && form.interests.trim() && form.city.trim() && form.adult && form.rules;
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(form));
      Alert.alert('Preview profile saved', 'Saved on this phone only. Your profile is not published and no other members can find it yet.', [{ text: 'Done', onPress: onClose }]);
    } catch { Alert.alert('Could not save', 'Please try again.'); }
    finally { setSaving(false); }
  };
  const button = (title, onPress, disabled = false) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ padding: 15, minHeight: 48, borderRadius: 14, backgroundColor: disabled ? '#B5C7CF' : '#087EA4', alignItems: 'center' }}><Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>{title}</Text></TouchableOpacity>;
  const field = (name, label, placeholder, multiline = false) => <View style={{ gap: 7 }}><Text style={{ color: '#173342', fontWeight: '700', fontSize: 15 }}>{label}</Text><TextInput accessibilityLabel={label} editable={ready} value={form[name]} onChangeText={value => patch(name, value)} maxLength={multiline ? 400 : 100} multiline={multiline} placeholder={placeholder} placeholderTextColor="#617985" style={{ borderColor: '#BCD0DB', borderWidth: 1, borderRadius: 12, padding: 14, color: '#173342', fontSize: 15, minHeight: multiline ? 96 : 48, textAlignVertical: 'top' }} /></View>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 50, gap: 18 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{!!user?.avatarUrl && <Image source={{ uri: user.avatarUrl }} style={{ width: 58, height: 58, borderRadius: 29 }} />}<View><Text style={{ color: '#173342', fontWeight: '800', fontSize: 24 }}>Join Pals</Text><Text style={{ color: '#486371', marginTop: 4 }}>Use your existing OkTreat account</Text></View></View>
    <Text style={{ backgroundColor: '#EAF7FB', padding: 14, borderRadius: 12, color: '#365463', lineHeight: 21 }}>TestFlight preview. Your details stay on this phone. Visibility and joining are not connected to real discovery yet.</Text>
    {field('bio', 'About me', 'What would you enjoy doing together?', true)}
    {field('languages', 'Languages', 'English, Japanese…')}
    {field('interests', 'Interests', 'Exploring, food, arts, pets—or your own interests')}
    <Text style={{ color: '#173342', fontWeight: '700' }}>I am</Text><View style={{ flexDirection: 'row', gap: 10 }}>{['Local', 'Visiting'].map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: form.role === value }} onPress={() => patch('role', value)} style={{ flex: 1, borderRadius: 20, padding: 13, backgroundColor: form.role === value ? '#087EA4' : '#EEF5F8', alignItems: 'center' }}><Text style={{ color: form.role === value ? '#FFF' : '#173342', fontWeight: '700' }}>{value}</Text></TouchableOpacity>)}</View>
    {field('city', 'City or area', 'City and country—never your home address')}
    <Text style={{ color: '#486371', lineHeight: 20 }}>Only an approximate area will appear in discovery. Your email, phone number and booking details stay private.</Text>
    {[['visible', 'Show my profile', 'Preview preference only. Nothing is published.'], ['adult', 'I am 18 or older', 'Live eligibility checks will be required before meetups.'], ['rules', 'I agree to the Pals community rules', 'Be respectful. No harassment or requests for money. Meet in public places.']].map(([name, label, help]) => <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: '#173342', fontWeight: '700', fontSize: 15 }}>{label}</Text><Text style={{ color: '#486371', lineHeight: 20, marginTop: 4 }}>{help}</Text></View><Switch accessibilityLabel={label} value={form[name]} onValueChange={value => patch(name, value)} trackColor={{ false: '#CBD5DC', true: '#087EA4' }} /></View>)}
    <Text style={{ color: '#486371', lineHeight: 20 }}>Identity verification will be required before arranging real meetups. Verification cannot guarantee safety.</Text>
    {button(saving ? 'Saving…' : 'Save preview profile', save, !valid || saving)}
    {button('Delete preview profile', async () => { try { await AsyncStorage.removeItem(key); setForm(empty); Alert.alert('Preview profile deleted'); } catch { Alert.alert('Could not delete', 'Please try again.'); } }, !ready || saving)}
  </ScrollView>;
}
