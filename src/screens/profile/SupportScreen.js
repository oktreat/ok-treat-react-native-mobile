import { copy, useCopyUpdates } from '../../i18n/copy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import api from '../../config/api';

const categories = [['booking', 'Booking'], ['payment', 'TreatCoins / payment'], ['account', 'Account'], ['app', 'App problem'], ['safety', 'Safety concern']];
const errorText = e => e?.response?.data?.message || copy('Could not connect. Please try again or use email support.');
const Action = ({ title, onPress, disabled = false, secondary = false }) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && { opacity: 0.5 }]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text></TouchableOpacity>;

export default function SupportScreen({ route, navigation }) {
  useCopyUpdates();
  const { supportEmail } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState(route.params?.supportCaseId ? 'thread' : 'list');
  const [caseId, setCaseId] = useState(route.params?.supportCaseId || null);
  const [cases, setCases] = useState([]);
  const [thread, setThread] = useState(null);
  const [category, setCategory] = useState('app');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [casePage, setCasePage] = useState(0);
  const [caseFilter, setCaseFilter] = useState('open');
  const [hasMoreCases, setHasMoreCases] = useState(false);
  const requestId = useRef(Crypto.randomUUID());
  const lock = useRef(false);
  const cursor = useRef(null);
  const userEpoch = useRef(0);
  useEffect(() => {
    userEpoch.current++;
    setThread(null); cursor.current = null;
    if (route.params?.supportCaseId) { setCaseId(route.params.supportCaseId); setMode('thread'); }
  }, [route.params?.supportCaseId]);

  const load = useCallback(async (older = false) => {
    if (mode === 'form') return;
    const epoch = userEpoch.current;
    try {
      const path = mode === 'thread' && caseId ? '/support/cases/' + caseId + '/messages' + (older && cursor.current ? '?before=' + cursor.current : '') : '/support/cases?page=' + casePage + '&status=' + caseFilter;
      const response = (await api.get(path, { timeout: 20000 })).data;
      const result = response.data;
      if (epoch !== userEpoch.current) return;
      if (mode === 'thread') {
        setThread(prev => {
          const combined = [...(prev?.messages || []), ...result.messages];
          const messages = [...new Map(combined.map(m => [m.id, m])).values()].sort((a, b) => Number(a.id) - Number(b.id));
          return { ...result, messages };
        });
        if (older || !cursor.current) cursor.current = result.before;
      } else { setCases(result); setHasMoreCases(!!response.pagination?.hasMore); }
      setError('');
    } catch (e) { if (epoch === userEpoch.current) setError(errorText(e)); }
  }, [mode, caseId, casePage, caseFilter]);

  useFocusEffect(useCallback(() => {
    load();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') load(); });
    const interval = setInterval(() => { if (AppState.currentState === 'active') load(); }, 12000);
    return () => { userEpoch.current++; clearInterval(interval); sub.remove(); };
  }, [load]));

  const open = id => { userEpoch.current++; setThread(null); cursor.current = null; setCaseId(id); setMode('thread'); };
  const submit = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (mode === 'form') {
        const result = (await api.post('/support/cases', { category, subject, message, requestId: requestId.current }, { timeout: 45000 })).data.data;
        open(result.id); setMessage(''); setSubject(''); requestId.current = Crypto.randomUUID();
      } else {
        await api.post('/support/cases/' + caseId + '/messages', { message: reply }, { timeout: 20000 });
        setReply(''); await load();
      }
    } catch (e) { setError(errorText(e) + (e?.code === 'ECONNABORTED' ? ' Check your conversation before sending again; your message may have arrived.' : '')); }
    finally { lock.current = false; setBusy(false); }
  };
  const start = cat => { userEpoch.current++; setCategory(cat); setError(''); setSubject(''); setMessage(''); requestId.current = Crypto.randomUUID(); setMode('form'); };
  const back = () => { if (mode === 'list') navigation.goBack(); else { userEpoch.current++; setMode('list'); setCaseId(null); setThread(null); setError(''); } };
  const email = async () => { try { await Linking.openURL('mailto:' + (supportEmail || 'careteam@oktreat.com') + '?subject=OkTreat%20Support'); } catch { setError('Email ' + (supportEmail || 'careteam@oktreat.com') + ' for help.'); } };

  return <ScreenWrapper noBottomTabs><View style={styles.container}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy("Back")} onPress={back} style={styles.back}><BackArrowIcon width={20} height={20} /></TouchableOpacity><Text style={styles.title}>{copy("OkTreat Support")}</Text><View style={styles.back} /></View>
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={20} contentContainerStyle={styles.content}>
      {!!error && <View accessibilityRole="alert" style={styles.error}><Text style={styles.text}>{error}</Text><Action title={copy("Try again")} secondary onPress={() => load()} /><Action title={copy("Email support")} secondary onPress={email} /></View>}
      {mode === 'list' && <>
        <View style={styles.card}><Text style={styles.heading}>{copy("How can we help?")}</Text><Text style={styles.text}>{copy("Send a request and return here to read our reply. Support is not monitored continuously.")}</Text><Action title={copy("Get help")} onPress={() => start('booking')} /><Action title={copy("Report a safety concern")} secondary onPress={() => start('safety')} /></View>
        <View style={styles.card}><Text style={styles.heading}>{copy("Missing pet or emergency?")}</Text><Text style={styles.text}>{copy("For a missing pet, open your pet’s profile and choose Report missing to send nearby alerts. For immediate danger to a person, contact local emergency services. For urgent pet injury or illness, contact a veterinarian.")}</Text></View>
        <Text style={styles.heading}>{copy("My support requests")}</Text>
        <View style={styles.choices}>{[['open', 'Open'], ['resolved', 'Resolved']].map(([key, label]) => <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: caseFilter === key }} style={[styles.choice, caseFilter === key && styles.selected]} onPress={() => { userEpoch.current++; setCases([]); setHasMoreCases(false); setCasePage(0); setCaseFilter(key); }}><Text style={styles.text}>{copy(label)}</Text></TouchableOpacity>)}</View>
        {cases.length === 0 && <Text style={styles.text}>{copy("Your requests will appear here.")}</Text>}
        {cases.map(c => <TouchableOpacity key={c.id} accessibilityRole="button" onPress={() => open(c.id)} style={[styles.card, { padding: 14, gap: 6 }]}><Text style={styles.heading}>{c.subject}</Text><Text style={styles.text}>#{c.conversationId || c.id.slice(0, 8)} · {c.category} · {c.status}</Text></TouchableOpacity>)}
        <View style={styles.choices}>{casePage > 0 && <Action title={copy("Previous 5")} secondary onPress={() => { userEpoch.current++; setCases([]); setHasMoreCases(false); setCasePage(p => p - 1); }} />}{hasMoreCases && <Action title={copy("Next 5")} secondary onPress={() => { userEpoch.current++; setCases([]); setHasMoreCases(false); setCasePage(p => p + 1); }} />}</View>
        <Action title={copy("Email support instead")} secondary onPress={email} />
      </>}
      {mode === 'form' && <View style={styles.card}>
        <Text style={styles.heading}>{copy("New support request")}</Text><Text style={styles.text}>{copy("Category")}</Text>
        <View style={styles.choices}>{categories.map(([key, label]) => <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: category === key }} onPress={() => setCategory(key)} style={[styles.choice, category === key && styles.selected]}><Text style={styles.text}>{copy(label)}</Text></TouchableOpacity>)}</View>
        {category === 'safety' && <Text style={styles.warning}>{copy("Safety reports are prioritised for review. This is not an emergency service. Seek local emergency help or veterinary care immediately when needed.")}</Text>}
        <Text style={styles.text}>{copy("Subject")}</Text><TextInput accessibilityLabel={copy("Support subject")} value={subject} onChangeText={setSubject} maxLength={120} placeholder={copy("What do you need help with?")} placeholderTextColor="#697888" style={styles.input} />
        <Text style={styles.text}>{copy("Details")}</Text><TextInput accessibilityLabel={copy("Support details")} value={message} onChangeText={setMessage} maxLength={5000} multiline textAlignVertical="top" placeholder={copy("Describe the issue and include a booking reference if relevant.")} placeholderTextColor="#697888" style={[styles.input, { minHeight: 150 }]} />
        <Text style={styles.small}>{copy("Your name, email and message will be shared with OkTreat’s support inbox, hosted by Chatwoot. Do not send passwords or payment card details.")}</Text>
        <Action title={busy ? copy("Sending…") : copy("Send request")} disabled={busy || !subject.trim() || !message.trim()} onPress={submit} />
      </View>}
      {mode === 'thread' && <>
        {!thread ? <ActivityIndicator accessibilityLabel={copy("Loading support conversation")} color="#08779D" /> : <>
          <Text style={styles.heading}>{thread.subject}</Text><Text style={styles.small}>{copy('Case #{{id}} · {{status}}', { id: thread.conversationId, status: copy(thread.status === 'resolved' ? 'Resolved' : 'Open') })}</Text>
          {!!cursor.current && <Action title={copy("Load older messages")} secondary onPress={() => load(true)} />}
          {thread.messages.map(m => <View key={m.id} style={[styles.bubble, !m.fromSupport && styles.mine]}><Text style={styles.small}>{m.fromSupport ? copy("OkTreat Support") : copy("You")}</Text><Text selectable style={styles.text}>{m.content}</Text>{m.attachments?.map(a => <TouchableOpacity key={a.id} accessibilityRole="link" onPress={() => Linking.openURL(a.url).catch(() => setError(copy("Could not open attachment.")))}><Text style={styles.link}>{copy("Open attachment")}</Text></TouchableOpacity>)}</View>)}
        </>}
      </>}
    </KeyboardAwareScrollView>
    {mode === 'thread' && thread && <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}><View style={[styles.composer, { paddingBottom: Math.max(12, insets.bottom) }]}><TextInput accessibilityLabel={copy("Reply to support")} multiline maxLength={5000} value={reply} onChangeText={setReply} placeholder={copy("Write a reply…")} placeholderTextColor="#697888" style={[styles.input, { maxHeight: 120 }]} /><Action title={busy ? copy("Sending…") : copy("Send reply")} disabled={busy || !reply.trim()} onPress={submit} /></View></KeyboardStickyView>}
  </View></ScreenWrapper>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, back: { padding: 8, width: 40 }, title: { fontSize: 19, fontWeight: '600', color: '#182A39' }, content: { padding: 20, gap: 14, paddingBottom: 36 }, card: { borderWidth: 1, borderColor: '#D9E2E9', borderRadius: 18, padding: 18, gap: 14 }, heading: { fontSize: 18, fontWeight: '600', color: '#182A39' }, text: { fontSize: 15, lineHeight: 23, color: '#34495A' }, small: { fontSize: 12, lineHeight: 19, color: '#536777' }, button: { backgroundColor: '#08779D', padding: 15, borderRadius: 14, alignItems: 'center' }, buttonText: { color: '#FFF', fontWeight: '600', fontSize: 15 }, secondary: { backgroundColor: '#EAF4F8', borderWidth: 1, borderColor: '#B7D7E3' }, secondaryText: { color: '#075B78' }, input: { borderWidth: 1, borderColor: '#ACBBC8', borderRadius: 12, padding: 13, color: '#182A39', fontSize: 15, backgroundColor: '#FFF' }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { borderWidth: 1, borderColor: '#C7D1DA', padding: 10, borderRadius: 12 }, selected: { backgroundColor: '#DEF0F8', borderColor: '#08779D' }, warning: { color: '#723B00', backgroundColor: '#FFF4E5', padding: 12, lineHeight: 22 }, error: { backgroundColor: '#FFF1EE', padding: 14, borderRadius: 14, gap: 8 }, bubble: { backgroundColor: '#EFF3F6', borderRadius: 14, padding: 14, gap: 6, marginRight: 22 }, mine: { backgroundColor: '#E0F2FA', marginRight: 0, marginLeft: 22 }, composer: { padding: 16, gap: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#D9E2E9' }, link: { color: '#08779D', paddingVertical: 8, textDecorationLine: 'underline' },
});
