import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Icon from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import api from '../../config/api';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { uploadToCloudinary } from '../../services/cloudinaryService';

const OWNER_TYPES = [
  ['WALK', 'Walk'], ['POTTY', 'Potty'], ['MEAL', 'Meal'], ['MEDICATION', 'Medication'],
  ['VACCINATION', 'Vaccination'], ['DEWORMING', 'Deworming'], ['VET_VISIT', 'Vet visit'], ['HEALTH_NOTE', 'Health note'],
];
const SITTER_TYPES = [['CARE_UPDATE', 'Care update'], ['WALK', 'Walk'], ['POTTY', 'Potty'], ['MEAL', 'Meal'], ['MEDICATION', 'Medication'], ['HEALTH_NOTE', 'Note']];

const entryLabel = kind => ({ WALK:'Walk', POTTY:'Potty', MEAL:'Meal', MEDICATION:'Medication', VACCINATION:'Vaccination', DEWORMING:'Deworming', VET_VISIT:'Vet visit', HEALTH_NOTE:'Health note', CARE_UPDATE:'Care update' }[kind] || kind);
const entryPhotos = item => Array.isArray(item.photos) && item.photos.length
  ? item.photos
  : (item.photoUrl ? [item.photoUrl] : []);


export default function PetCareDiaryScreen({ navigation, route }) {
  const { petId, petName = 'your pet', bookingId = null, sitterMode = false } = route?.params || {};
  const [entries, setEntries] = useState([]);
  const [kind, setKind] = useState(sitterMode ? 'CARE_UPDATE' : 'WALK');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [dueAt, setDueAt] = useState(null);
  const [showDate, setShowDate] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const types = sitterMode ? SITTER_TYPES : OWNER_TYPES;

  const load = useCallback(async () => {
    if (!petId) { setError('Pet information is missing.'); setLoading(false); return; }
    try {
      const response = await api.get(`/pets/${petId}/care-entries`);
      setEntries(response.data?.data?.entries || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Care history is not available yet.');
    } finally { setLoading(false); }
  }, [petId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!kind || busy) return;
    setBusy(true);
    try {
      let photoUrl = null;
      if (photoUri) {
        const image = await ImageManipulator.manipulateAsync(photoUri, [{ resize: { width: 1280 } }], { compress: 0.62, format: ImageManipulator.SaveFormat.JPEG });
        const uploaded = await uploadToCloudinary(image.uri, CLOUDINARY_FOLDERS.PETS, { tags: ['care-update'], context: `pet_id=${petId}` });
        photoUrl = uploaded.url;
      }
      await api.post(`/pets/${petId}/care-entries`, {
        kind, note: note.trim(), photoUrl,
        bookingId: sitterMode ? bookingId : undefined,
        durationMinutes: duration ? Number(duration) : undefined,
        calories: calories ? Number(calories) : undefined,
        dueAt: dueAt?.toISOString(),
      });
      setNote(''); setDuration(''); setCalories(''); setDueAt(null); setPhotoUri(null);
      await load();
      Alert.alert('Saved', sitterMode ? 'Your care update is saved for the pet owner.' : 'Your pet’s care diary has been updated.');
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.message || e.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  return <ScreenWrapper noBottomTabs><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back"><Icon name="chevron-back" size={25} color="#173342" /></TouchableOpacity><View style={{ flex: 1 }}><Text style={s.title}>{sitterMode ? 'Care updates' : 'Pet care diary'}</Text><Text style={s.subtitle}>{petName}</Text></View><Icon name="paw-outline" size={25} color="#1686A8" /></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.card}><Text style={s.sectionTitle}>{sitterMode ? 'Share a moment with the owner' : 'Add to the care diary'}</Text><View style={s.kindGrid}>{types.map(([value, label]) => <TouchableOpacity key={value} onPress={() => setKind(value)} style={[s.kindChip, kind === value && s.kindChipActive]}><Text style={[s.kindText, kind === value && s.kindTextActive]}>{label}</Text></TouchableOpacity>)}</View>
        <TextInput value={note} onChangeText={setNote} placeholder={sitterMode ? 'How is your pet doing? Add a note…' : 'Add details or instructions…'} placeholderTextColor="#70828A" multiline maxLength={1500} style={s.note} />
        {kind === 'WALK' && <View style={s.numberRow}><TextInput value={duration} onChangeText={v => setDuration(v.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="Walk minutes" placeholderTextColor="#70828A" style={[s.smallInput,{flex:1}]} /><TextInput value={calories} onChangeText={v => setCalories(v.replace(/[^0-9]/g, '').slice(0, 5))} keyboardType="number-pad" placeholder="Calories (optional)" placeholderTextColor="#70828A" style={[s.smallInput,{flex:1}]} /></View>}
        {!sitterMode && ['VACCINATION','DEWORMING','VET_VISIT','MEDICATION'].includes(kind) && <><TouchableOpacity style={s.dateBtn} onPress={() => setShowDate(true)}><Icon name="notifications-outline" size={18} color="#1686A8" /><Text style={s.dateText}>{dueAt ? `Reminder date: ${dueAt.toLocaleDateString()}` : 'Set a follow-up date'}</Text></TouchableOpacity>{showDate && <DateTimePicker value={dueAt || new Date()} mode="date" minimumDate={new Date()} onChange={(event, date) => { setShowDate(false); if (date) setDueAt(date); }} />}</>}
        {photoUri ? <View style={s.photoRow}><Image source={{ uri: photoUri }} style={s.preview} /><TouchableOpacity onPress={() => setPhotoUri(null)}><Text style={s.remove}>Remove photo</Text></TouchableOpacity></View> : <TouchableOpacity style={s.photoBtn} onPress={choosePhoto}><Icon name="camera-outline" size={19} color="#1686A8" /><Text style={s.photoText}>{sitterMode ? 'Add a care photo' : 'Add a photo'}</Text></TouchableOpacity>}
        {photoUri && <Text style={s.hint}>Photos are resized and compressed before upload.</Text>}
        <TouchableOpacity disabled={busy} onPress={save} style={[s.save,busy&&{opacity:.6}]}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.saveText}>{sitterMode ? 'Share care update' : 'Save entry'}</Text>}</TouchableOpacity>
      </View>
      <View style={s.card}><Text style={s.sectionTitle}>Recent care history</Text>{loading ? <ActivityIndicator color="#1686A8" /> : error ? <Text style={s.error}>{error}</Text> : !entries.length ? <Text style={s.empty}>Your care notes, walks, and health records will appear here.</Text> : entries.map(item => <View key={item.id} style={s.entry}><View style={s.entryTop}><Text style={s.entryKind}>{entryLabel(item.kind)}</Text><Text style={s.entryDate}>{new Date(item.occurredAt).toLocaleDateString()}</Text></View>{item.note ? <Text style={s.entryNote}>{item.note}</Text> : null}{item.durationMinutes ? <Text style={s.entryMeta}>{item.durationMinutes} min walk{item.calories ? ` · ${item.calories} calories` : ''}</Text> : null}{item.dueAt ? <Text style={s.reminder}>Follow-up: {new Date(item.dueAt).toLocaleDateString()}</Text> : null}{entryPhotos(item).length > 0 ? <View style={s.entryPhotos}>{entryPhotos(item).map((url,index)=><Image key={`${url}-${index}`} source={{ uri: url }} style={s.entryPhoto} resizeMode="cover" />)}</View> : null}</View>)}</View>
    </ScrollView>
  </KeyboardAvoidingView></ScreenWrapper>;
}

const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#F6FAFC'},header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingVertical:14,backgroundColor:'white',borderBottomWidth:1,borderColor:'#E2ECF1'},title:{fontSize:21,fontWeight:'800',color:'#173342'},subtitle:{fontSize:13,color:'#637782',marginTop:2},content:{padding:16,gap:14},card:{backgroundColor:'white',borderRadius:18,padding:16,borderWidth:1,borderColor:'#E1EBF0'},sectionTitle:{fontSize:17,fontWeight:'800',color:'#173342',marginBottom:12},kindGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},kindChip:{borderRadius:18,borderWidth:1,borderColor:'#C8D9E2',paddingVertical:8,paddingHorizontal:12,backgroundColor:'#F8FBFC'},kindChipActive:{backgroundColor:'#1686A8',borderColor:'#1686A8'},kindText:{fontSize:13,fontWeight:'600',color:'#34515F'},kindTextActive:{color:'white'},note:{minHeight:86,borderRadius:12,borderWidth:1,borderColor:'#D7E4EA',padding:12,textAlignVertical:'top',marginTop:12,color:'#173342'},numberRow:{flexDirection:'row',gap:8,marginTop:10},smallInput:{borderWidth:1,borderColor:'#D7E4EA',borderRadius:10,padding:11,color:'#173342'},dateBtn:{flexDirection:'row',alignItems:'center',gap:8,marginTop:12,padding:10,backgroundColor:'#F1F8FB',borderRadius:10},dateText:{color:'#175B76',fontWeight:'600'},photoBtn:{flexDirection:'row',alignItems:'center',gap:8,marginTop:12,padding:11,borderWidth:1,borderColor:'#C8DCE5',borderRadius:10,alignSelf:'flex-start'},photoText:{color:'#175B76',fontWeight:'700'},photoRow:{marginTop:12,gap:6},preview:{width:100,height:100,borderRadius:12},remove:{color:'#A52F2A'},hint:{color:'#697E88',fontSize:12,marginTop:6},save:{backgroundColor:'#1686A8',borderRadius:12,padding:14,alignItems:'center',marginTop:14},saveText:{color:'white',fontWeight:'800'},entry:{borderTopWidth:1,borderColor:'#E4EDF1',paddingVertical:12,gap:6},entryTop:{flexDirection:'row',justifyContent:'space-between'},entryKind:{fontWeight:'800',color:'#214451'},entryDate:{color:'#6A7E88',fontSize:12},entryNote:{color:'#3E5661',lineHeight:20},entryMeta:{fontSize:12,color:'#57707C'},reminder:{color:'#8A5F0D',fontSize:13,fontWeight:'600'},entryPhotos:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},entryPhoto:{width:96,height:96,borderRadius:12},empty:{color:'#71838B',lineHeight:20},error:{color:'#9A342D',lineHeight:20}});
