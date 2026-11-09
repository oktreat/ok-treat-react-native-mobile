import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import ScreenWrapper from '../../components/ScreenWrapper';
import PalsProfilePreview from '../../components/PalsProfilePreview';

// A self-contained TestFlight prototype: no real people, location collection,
// messages, verification claims or reports leave this screen.
const CITIES = {
  Reykjavík: { latitude: 64.1466, longitude: -21.9426 },
  Vancouver: { latitude: 49.2827, longitude: -123.1207 },
  Tokyo: { latitude: 35.6762, longitude: 139.6503 },
  London: { latitude: 51.5072, longitude: -0.1276 },
};
const ACTIVITIES = ['All', 'Coffee', 'Meals', 'Explore', 'Pet walks', 'Arts & culture', 'Sports & outdoors', 'Games & hobbies', 'Local events', 'Just a chat'];
const PEOPLE = [
  { id: 'anna', name: 'Anna', role: 'Local', language: 'English · Icelandic', interests: ['Coffee', 'Pet walks'], bio: 'Happy to share a favourite café and take a relaxed walk with my dog Luna.', pet: 'Luna · Friendly dog', color: '#DDF4FA', lat: .008, lng: -.013 },
  { id: 'sam', name: 'Sam', role: 'Traveller', language: 'English · Japanese', interests: ['Meals', 'Explore'], bio: 'Visiting for a few days. Looking for company over lunch and a city walk.', pet: 'Travelling without a pet', color: '#FFF0CB', lat: -.009, lng: .014 },
  { id: 'alex', name: 'Alex', role: 'Local', language: 'English', interests: ['Explore', 'Coffee'], bio: 'I enjoy showing visitors around public landmarks and meeting other pet lovers.', pet: 'With or without pets', color: '#E7EBFF', lat: .004, lng: .021 },
];
function Button({ title, onPress, secondary, disabled }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: .45 }]}><Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text></TouchableOpacity>;
}
function Chips({ values, selected, onSelect }) {
  return <View style={s.chips}>{values.map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: value === selected }} onPress={() => onSelect(value)} style={[s.chip, value === selected && s.activeChip]}><Text style={[s.chipText, value === selected && s.activeChipText]}>{value}</Text></TouchableOpacity>)}</View>;
}
export default function BondingScreen({ navigation }) {
  const [city, setCity] = useState('Vancouver');
  const [when, setWhen] = useState('Anytime');
  const [activity, setActivity] = useState('All');
  const [role, setRole] = useState('Everyone');
  const [view, setView] = useState('Map');
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [requests, setRequests] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [note, setNote] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [planTime, setPlanTime] = useState('');
  const [plans, setPlans] = useState([]);
  const [area, setArea] = useState(null);
  const [search, setSearch] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [extraInterests, setExtraInterests] = useState([]);
  const [searching, setSearching] = useState(false);
  const center = area || CITIES[city] || CITIES.Vancouver;
  const findArea = async (nearby = false) => {
    if (!nearby && !search.trim()) return;
    setSearching(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('Location access unavailable', 'You can still browse the default sample area. Location permission is optional.'); return; }
      const result = nearby ? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords : (await Location.geocodeAsync(search.trim()))[0];
      if (!result) { Alert.alert('Area not found', 'Try a city and country.'); return; }
      // Round to an approximate browsing area. Never persist or publish device coordinates.
      setArea({ latitude: Math.round(result.latitude * 100) / 100, longitude: Math.round(result.longitude * 100) / 100 });
      setCity(nearby ? 'Near me' : search.trim());
    } catch { Alert.alert('Could not find this area', 'Try again or keep browsing the default sample area.'); }
    finally { setSearching(false); }
  };
  const members = useMemo(() => PEOPLE.filter(p => !blocked.includes(p.id) && (activity === 'All' || p.interests.includes(activity)) && (role === 'Everyone' || p.role === role)), [activity, role, blocked]);
  const close = () => { setPanel(null); setSelected(null); setNote(''); };
  const request = () => {
    if (!selected || requests.some(r => r.id === selected.id)) return;
    setRequests(previous => [...previous, { id: selected.id, name: selected.name, city, when, note: note.trim() }]);
    close();
    Alert.alert('Preview request saved', 'No message was sent. A real member would accept or decline before chat opens. This sample request resets when you leave Pals.');
  };
  const createPlan = () => {
    if (!planTitle.trim() || !venue.trim() || !planTime.trim()) return;
    setPlans(previous => [...previous, { id: String(Date.now()), title: planTitle.trim(), venue: venue.trim(), time: planTime.trim(), city }]);
    setPlanTitle(''); setVenue(''); setPlanTime(''); close();
  };
  const sharePlan = async plan => {
    try { await Share.share({ message: `Pals — SAMPLE PLAN ONLY\n${plan.title}\n${plan.city} · ${plan.time}\nPublic meeting place: ${plan.venue}\nThis is a prototype, not an arranged meeting.` }); } catch { Alert.alert('Could not share', 'Please try again.'); }
  };
  return <ScreenWrapper noBottomTabs><View style={s.root}>
    <View style={s.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={s.back}><Icon name="chevron-back" size={26} color="#173342" /></TouchableOpacity><View style={{ flex: 1 }}><Text style={s.title}>Pals</Text><Text style={s.subtitle}>Good company. Anywhere.</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Safety information" onPress={() => setPanel('safety')} style={s.back}><Icon name="shield-checkmark-outline" size={25} color="#087EA4" /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.notice}><Text style={s.noticeTitle}>TESTFLIGHT PREVIEW · SAMPLE PEOPLE</Text><Text style={s.small}>Explore the flow with fictional members. Requests, visibility and reports are simulations. Location is used only if you choose it, to centre your map. Sample people are fictional and changes reset when you leave.</Text></View>
      <Button title="Join Pals / edit preview profile" onPress={() => setPanel('join')} />
      <Text style={s.label}>Explore an area</Text>
      <Button title={searching ? 'Finding area…' : 'Near me'} disabled={searching} onPress={() => findArea(true)} />
      <TextInput accessibilityLabel="Search city or area" value={search} onChangeText={setSearch} maxLength={100} placeholder="Search any city or area" placeholderTextColor="#647985" style={s.input} onSubmitEditing={() => findArea()} />
      <Button title="Explore this area" secondary disabled={searching || !search.trim()} onPress={() => findArea()} />
      <Text style={s.info}>Browsing: {city} · illustrative sample members</Text>
      <Chips values={['Anytime', 'Today', 'Tomorrow', 'Planning a trip']} selected={when} onSelect={setWhen} />
      {when === 'Planning a trip' && <Text style={s.info}>Browse before you travel. These sample results do not represent current members or availability.</Text>}
      <View style={s.visibility}><View style={{ flex: 1 }}><Text style={s.label}>Open to meeting</Text><Text style={s.small}>Preview switch only · hidden by default</Text></View><Switch accessibilityLabel="Preview availability" value={visible} onValueChange={setVisible} trackColor={{ false: '#CBD5DC', true: '#087EA4' }} /></View>
      <Chips values={[...ACTIVITIES, ...extraInterests]} selected={activity} onSelect={setActivity} />
      <TextInput accessibilityLabel="Add your own interest" maxLength={40} value={customInterest} onChangeText={setCustomInterest} placeholder="Add your own interest" placeholderTextColor="#647985" style={s.input} onSubmitEditing={() => { const value = customInterest.trim(); if (value && !ACTIVITIES.includes(value) && !extraInterests.includes(value)) setExtraInterests(old => [...old, value]); setCustomInterest(''); }} />
      <Chips values={['Everyone', 'Local', 'Traveller']} selected={role} onSelect={setRole} />
      <View style={s.row}><Text style={s.section}>{members.length} sample members</Text><Chips values={['Map', 'List']} selected={view} onSelect={setView} /></View>
      {view === 'Map' && Platform.OS !== 'web' && <View style={s.mapBox}><MapView key={city} style={s.map} onRegionChangeComplete={region => setArea({ latitude: region.latitude, longitude: region.longitude })} initialRegion={{ ...center, latitudeDelta: .065, longitudeDelta: .085 }} showsUserLocation={false} showsMyLocationButton={false} showsPointsOfInterest={false}>{members.map(p => <Marker key={p.id} coordinate={{ latitude: center.latitude + p.lat, longitude: center.longitude + p.lng }} title={`${p.name} · Sample ${p.role.toLowerCase()}`} onPress={() => { setSelected(p); setPanel('profile'); }}><View style={s.pin}><Text style={s.pinText}>{p.name[0]}</Text></View></Marker>)}</MapView></View>}
      {view === 'Map' && <Text style={s.small}>Illustrative area markers only. Never a member’s exact position.</Text>}
      {members.length === 0 && <View style={s.card}><Text style={s.label}>No sample members match</Text><Text style={s.body}>Try another activity or member filter.</Text></View>}
      {members.map(p => <TouchableOpacity key={p.id} accessibilityRole="button" onPress={() => { setSelected(p); setPanel('profile'); }} style={s.card}><View style={s.row}><View style={[s.avatar, { backgroundColor: p.color }]}><Text style={s.initial}>{p.name[0]}</Text></View><View style={{ flex: 1 }}><Text style={s.name}>{p.name} · {p.role}</Text><Text style={s.small}>{city} · {p.language}</Text><Text style={s.info}>{p.interests.join(' · ')}</Text></View><Icon name="chevron-forward" size={20} color="#087EA4" /></View><Text style={s.body}>{p.bio}</Text></TouchableOpacity>)}
      <Text style={s.section}>Make a plan</Text><Text style={s.body}>Suggest an activity around any shared interest—with or without pets.</Text><Button title="Create a sample meetup" onPress={() => setPanel('create')} />
      {plans.filter(p => p.city === city).map(p => <View key={p.id} style={s.card}><Text style={s.name}>{p.title}</Text><Text style={s.body}>{p.city} · {p.time}</Text><Text style={s.body}>Public place: {p.venue}</Text><Text style={s.small}>Private sample · not published to anyone</Text><Button title="Share sample plan" secondary onPress={() => sharePlan(p)} /><Button title="Remove sample plan" secondary onPress={() => setPlans(old => old.filter(x => x.id !== p.id))} /></View>)}
      <Button title={`Preview requests (${requests.length})`} secondary onPress={() => setPanel('requests')} />
      <View style={s.notice}><Text style={s.label}>With or without your pet</Text><Text style={s.body}>You can meet pet-loving locals while your own pet stays with a sitter. Your bookings and home details stay private.</Text></View>
    </ScrollView>
    <Modal visible={!!panel} animationType="slide" onRequestClose={close} presentationStyle="pageSheet"><ScreenWrapper noBottomTabs><View style={s.header}><Text style={[s.section, { flex: 1 }]}>{panel === 'join' ? 'Your Pals profile' : panel === 'profile' ? 'Meet a member' : panel === 'create' ? 'Create a sample plan' : panel === 'requests' ? 'Preview requests' : 'Safety & privacy'}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={s.back}><Icon name="close" size={27} color="#173342" /></TouchableOpacity></View><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {panel === 'join' && <PalsProfilePreview onClose={close} />}
      {panel === 'profile' && selected && <><View style={[s.hero, { backgroundColor: selected.color }]}><Icon name="people-outline" size={64} color="#087EA4" /><Text style={s.title}>{selected.name}</Text><Text style={s.body}>Fictional {selected.role.toLowerCase()} · {city}</Text></View><Text style={s.info}>Sample profile — identity has not been checked</Text><Text style={s.body}>{selected.bio}</Text><Text style={s.label}>{selected.language}</Text><Text style={s.body}>{selected.pet}</Text><Text style={s.body}>Open to: {selected.interests.join(', ')}</Text><Text style={s.label}>Introduce yourself</Text><TextInput accessibilityLabel="Introduction" multiline maxLength={500} value={note} onChangeText={setNote} placeholder="A coffee and a walk would be lovely…" placeholderTextColor="#647985" style={[s.input, { minHeight: 100 }]} /><Button title={requests.some(r => r.id === selected.id) ? 'Sample request pending' : 'Try a connection request'} disabled={requests.some(r => r.id === selected.id)} onPress={request} /><Text style={s.small}>Real chat will require mutual acceptance. No message is sent in this preview.</Text><Button title="Block sample member" secondary onPress={() => { setBlocked(old => [...old, selected.id]); close(); }} /><Button title="Try reporting" secondary onPress={() => Alert.alert('Reporting preview', 'No report has been submitted. Live reporting and the admin moderation queue must be connected before launch.')} /></>}
      {panel === 'create' && <><Text style={s.body}>{city} · This plan is visible only in this preview session.</Text><Text style={s.label}>Activity</Text><TextInput accessibilityLabel="Activity title" maxLength={80} value={planTitle} onChangeText={setPlanTitle} placeholder="Coffee and a harbour walk" placeholderTextColor="#647985" style={s.input} /><Text style={s.label}>Public venue</Text><TextInput accessibilityLabel="Public venue" maxLength={120} value={venue} onChangeText={setVenue} placeholder="A café or public landmark—not a home address" placeholderTextColor="#647985" style={s.input} /><Text style={s.label}>Date and time</Text><TextInput accessibilityLabel="Date and time" maxLength={80} value={planTime} onChangeText={setPlanTime} placeholder="Saturday, 2 PM" placeholderTextColor="#647985" style={s.input} /><Button title="Save sample plan" disabled={!planTitle.trim() || !venue.trim() || !planTime.trim()} onPress={createPlan} /><Text style={s.info}>Each person pays their own costs. Bringing a pet should be agreed in advance.</Text></>}
      {panel === 'requests' && <>{requests.length === 0 && <Text style={s.body}>No sample requests yet. Open a member profile to try one.</Text>}{requests.map(r => <View key={r.id} style={s.card}><Text style={s.name}>{r.name} · Sample pending request</Text><Text style={s.body}>{r.city} · {r.when}</Text>{!!r.note && <Text style={s.body}>{r.note}</Text>}<Button title="Withdraw sample request" secondary onPress={() => setRequests(old => old.filter(x => x.id !== r.id))} /></View>)}</>}
      {panel === 'safety' && <><Text style={s.title}>Meet thoughtfully</Text>{['Community participation will be for adults 18+ with eligibility and identity checks before arranging meetups. Verification cannot guarantee safety.', 'Use public meeting places. Arrange your own transport and tell someone you trust about your plan.', 'Exact home, sitter and booking locations must never appear on the community map.', 'You choose when to appear. Live availability will expire automatically.', 'Chat opens after mutual acceptance. You can decline, block or report unwanted contact.', 'No harassment, dating solicitation or requests for money. Pet attendance must be agreed.', 'This preview has no monitored safety service or emergency response. For immediate danger, contact local emergency services.'].map(line => <View key={line} style={s.card}><Text style={s.body}>{line}</Text></View>)}{blocked.length > 0 && <Button title="Reset sample blocks" secondary onPress={() => setBlocked([])} />}<Text style={s.small}>Live moderation, checks and reporting remain required before public launch.</Text></>}
    </ScrollView></ScreenWrapper></Modal>
  </View></ScreenWrapper>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' }, header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 }, back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 25, fontWeight: '800', color: '#173342' }, subtitle: { fontSize: 14, color: '#486371', marginTop: 3 }, content: { padding: 20, paddingTop: 4, paddingBottom: 40, gap: 12 }, notice: { backgroundColor: '#EAF7FB', padding: 15, borderRadius: 16, gap: 6 }, noticeTitle: { color: '#14546B', fontWeight: '800', fontSize: 12 }, small: { color: '#486371', fontSize: 12, lineHeight: 18 }, label: { color: '#173342', fontSize: 15, fontWeight: '700' }, body: { color: '#304F5F', fontSize: 15, lineHeight: 23 }, info: { color: '#176A87', fontSize: 13, lineHeight: 20 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 12, paddingVertical: 11, minHeight: 44, borderRadius: 22, backgroundColor: '#F0F5F8', justifyContent: 'center' }, activeChip: { backgroundColor: '#087EA4' }, chipText: { fontSize: 13, color: '#284A5B', fontWeight: '600' }, activeChipText: { color: '#FFF' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' }, section: { fontSize: 19, fontWeight: '800', color: '#173342' }, visibility: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F4F8FA', borderRadius: 14, gap: 12 }, mapBox: { height: 270, borderRadius: 20, overflow: 'hidden' }, map: { flex: 1 }, pin: { padding: 10, minWidth: 42, borderRadius: 24, backgroundColor: '#087EA4', borderColor: '#FFF', borderWidth: 3, alignItems: 'center' }, pinText: { color: '#FFF', fontWeight: '800', fontSize: 16 }, card: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#DAE5EB', backgroundColor: '#FFF', gap: 10 }, avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, initial: { color: '#173342', fontSize: 22, fontWeight: '800' }, name: { color: '#173342', fontSize: 17, fontWeight: '700' }, button: { minHeight: 48, borderRadius: 14, backgroundColor: '#087EA4', padding: 14, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFF', fontWeight: '700', fontSize: 15 }, secondary: { backgroundColor: '#EEF7FB', borderWidth: 1, borderColor: '#BCD6E2' }, secondaryText: { color: '#14546B' }, hero: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 }, input: { borderWidth: 1, borderColor: '#AEC8D5', borderRadius: 12, padding: 14, fontSize: 15, color: '#173342', textAlignVertical: 'top', minHeight: 48 },
});

