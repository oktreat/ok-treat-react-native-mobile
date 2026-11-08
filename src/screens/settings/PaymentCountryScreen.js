import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { BackArrowIcon } from '../../assets';
import { getPaymentMarket, savePaymentCountry } from '../../services/paymentCountryService';
import { copy, useCopyUpdates } from '../../i18n/copy';

const CHECKOUT_CURRENCIES = [['USD', 'US Dollar'], ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'], ['JPY', 'Japanese Yen'], ['GBP', 'British Pound'], ['EUR', 'Euro']];

export default function PaymentCountryScreen({ navigation }) {
  useCopyUpdates();
  const [market, setMarket] = useState(null), [selected, setSelected] = useState(null);
  const [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const load = () => { setError(''); getPaymentMarket().then(value => { setMarket(value); setSelected(value.currency); }).catch(() => setError(copy('Could not load currencies. Please try again.'))); };
  useEffect(() => { let active = true; getPaymentMarket().then(value => { if (active) { setMarket(value); setSelected(value.currency); } }).catch(() => { if (active) setError(copy('Could not load currencies. Please try again.')); }); return () => { active = false; }; }, []);
  const save = async () => {
    if (saving || !selected) return;
    setSaving(true); setError('');
    try { await savePaymentCountry(market.country, selected); navigation.goBack(); }
    catch { setError(copy('Could not save currency. Please try again.')); }
    finally { setSaving(false); }
  };
  return <ScreenWrapper noBottomTabs><View style={styles.container}>
    <View style={styles.header}><TouchableOpacity accessibilityLabel={copy('Back')} onPress={() => navigation.goBack()} style={styles.back}><BackArrowIcon width={20} height={20}/></TouchableOpacity><Text style={styles.title}>{copy('Payment currency')}</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.note}>{copy('Your phone region suggests a currency. Choose one of these six checkout currencies. Language is set separately.')}</Text>
      {!market && !error && <ActivityIndicator color="#087EA4"/>}
      {!!error && <View accessibilityRole="alert"><Text style={styles.error}>{error}</Text>{!market && <Button title={copy('Retry')} onPress={load}/>}</View>}
      {!!market && CHECKOUT_CURRENCIES.map(([currency, name]) => <TouchableOpacity accessibilityRole="radio" accessibilityState={{ selected: selected === currency }} key={currency} disabled={saving} onPress={() => setSelected(currency)} style={[styles.row, selected === currency && styles.selected]}><Text style={styles.name}>{copy(name)}</Text><Text style={styles.currency}>{currency}</Text></TouchableOpacity>)}
    </ScrollView>
    <View style={styles.footer}><Button title={saving ? copy('Saving…') : copy('Confirm currency')} onPress={save} disabled={!market || !selected || saving} fullWidth/></View>
  </View></ScreenWrapper>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFF' }, header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }, back: { padding: 10 }, title: { fontSize: 20, fontWeight: '700', color: '#142D38', flex: 1 }, content: { padding: 24, gap: 10 }, note: { fontSize: 14, color: '#526571', lineHeight: 22, marginBottom: 8 }, row: { padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D9E2E9', borderRadius: 14, gap: 12 }, selected: { backgroundColor: '#E2F3FB', borderColor: '#087EA4' }, name: { flex: 1, color: '#142D38', fontSize: 16 }, currency: { color: '#087EA4', fontWeight: '700' }, footer: { padding: 20 }, error: { color: '#AC2828', marginBottom: 12 } });
