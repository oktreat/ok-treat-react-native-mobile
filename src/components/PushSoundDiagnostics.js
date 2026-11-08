import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { PUSH_DIAGNOSTICS, getPushDiagnostics, scheduleSoundDiagnostic } from '../services/pushDiagnostics';

export default function PushSoundDiagnostics() {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  if (!PUSH_DIAGNOSTICS) return null;
  const refresh = async () => {
    setBusy(true);
    try { setReport(await getPushDiagnostics()); setNotice(''); }
    catch { setNotice('Could not read notification settings. Try Refresh.'); }
    finally { setBusy(false); }
  };
  const schedule = async () => {
    setBusy(true);
    try {
      await scheduleSoundDiagnostic();
      setNotice('Test scheduled. Return Home and lock the iPhone now. It arrives in 10 seconds.');
    } catch { setNotice('Could not schedule the test. Check notification permission.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.entry}>
      <TouchableOpacity accessibilityRole="button" onPress={() => { setOpen(true); refresh(); }}>
        <Text style={styles.link}>Notification sound test (diagnostic build)</Text>
      </TouchableOpacity>
      <Modal visible={open} onRequestClose={() => setOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.heading}>Notification sound test</Text>
          <Text>In this iPhone build, the separate in-app chime is disabled. Apple notification sounds remain enabled.</Text>
          <Text style={styles.help}>Use the timed test, then compare it with a message sent from your other account while this phone is locked. Refresh here afterward.</Text>
          <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={schedule}><Text style={styles.buttonText}>Test sound in 10 seconds</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={refresh}><Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Refresh details'}</Text></TouchableOpacity>
          {!!notice && <Text accessibilityLiveRegion="polite" style={styles.help}>{notice}</Text>}
          <Text style={styles.help}>These details show permission and sound metadata, not whether iOS played audio. Locked-screen notifications are inspected when you return. Message text, account IDs and push tokens are not recorded or uploaded.</Text>
          <Text selectable style={styles.report}>{report ? JSON.stringify(report, null, 2) : 'No details yet.'}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setOpen(false)}><Text style={styles.buttonText}>Close</Text></TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  entry: { paddingHorizontal: 24, paddingVertical: 10 },
  link: { color: '#086A88', fontSize: 14 },
  sheet: { padding: 24, paddingTop: 32, paddingBottom: 48, gap: 16 },
  heading: { fontSize: 22, fontWeight: '600', color: '#173D4C' },
  help: { fontSize: 14, lineHeight: 21, color: '#405965' },
  button: { backgroundColor: '#086A88', padding: 16, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  report: { fontFamily: 'Courier', fontSize: 12, color: '#173D4C' },
});
