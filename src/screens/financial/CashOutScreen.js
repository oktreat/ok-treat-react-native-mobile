import { displayLocale } from '../../utils/localizedDisplay';
import { copy, useCopyUpdates } from '../../i18n/copy';
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { useAppAlert } from '../../context/AlertContext';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary';
import { iosKeyboardDismissMode } from '../../utils/keyboard';
import {
  getCashoutConfig, getMyWithdrawals, createWithdrawal,
  startConnectOnboarding, proceedWithdrawal, computeBreakdown,
} from '../../services/payoutService';

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

const DOC_SLOTS = [
  { key: 'idFront', req: 'ID_FRONT', label: 'ID front' },
  { key: 'idBack', req: 'ID_BACK', label: 'ID back' },
  { key: 'selfie', req: 'SELFIE', label: 'Selfie' },
];

const STATUS_META = {
  PENDING: { color: '#B7791F', bg: '#FFF7E6', label: 'Under review' },
  APPROVED: { color: '#2B6CB0', bg: '#EAF3FB', label: 'Approved' },
  PROCESSING: { color: '#6B46C1', bg: '#F0E9FB', label: 'Processing' },
  COMPLETED: { color: '#2E9E5B', bg: '#E7F7EE', label: 'Completed' },
  REJECTED: { color: '#C53030', bg: '#FDECEC', label: 'Rejected' },
  FAILED: { color: '#C53030', bg: '#FDECEC', label: 'Failed' },
};

export default function CashOutScreen({ navigation }) {
  useCopyUpdates();
  const alert = useAppAlert();
  const [cfg, setCfg] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState({});
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, h] = await Promise.all([getCashoutConfig(), getMyWithdrawals().catch(() => [])]);
      setCfg(c);
      setHistory(h);
    } catch (e) {
      alert(copy("Error"), copy("Could not load cash-out. Please try again."), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const settings = cfg?.settings;
  const cashable = cfg?.cashableCoins || 0;
  const coins = /^\d+$/.test(amount) ? parseInt(amount, 10) : (amount ? NaN : 0);
  const bd = settings && Number.isFinite(coins) ? computeBreakdown(coins, settings) : null;
  const requiredDocs = settings?.requiredDocs || [];
  const slots = DOC_SLOTS.filter((s) => requiredDocs.includes(s.req));
  const docsDone = slots.filter((s) => docs[s.key]).length;
  const docsComplete = docsDone === slots.length;

  const minCoins = settings ? Math.ceil((settings.minWithdrawalCents / 100) * settings.coinsPerDollar) : 0;

  // ---- strong, explicit validation ----
  let amountError = '';
  if (amount && !Number.isFinite(coins)) amountError = copy("Enter a whole number of TreatCoins.");
  else if (coins > 0 && coins > cashable) amountError = copy("You only have {{value0}} TreatCoins available.", {value0: cashable});
  else if (coins > 0 && bd && bd.grossCents < settings.minWithdrawalCents) amountError = copy("Minimum withdrawal is {{value0}} ({{value1}} TreatCoins).", {value0: money(settings.minWithdrawalCents), value1: minCoins});
  else if (coins > 0 && bd && bd.netCents <= 0) amountError = copy("Amount is too low after fees.");

  const amountValid = coins > 0 && !amountError;
  const canSubmit = amountValid && docsComplete && !busy;

  const pickDoc = async (slot) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled || !res.assets?.[0]) return;
      setUploading((u) => ({ ...u, [slot]: true }));
      const up = await uploadToCloudinary(res.assets[0].uri, CLOUDINARY_FOLDERS.USERS);
      if (up?.url) setDocs((d) => ({ ...d, [slot]: up.url }));
      else alert(copy("Upload failed"), copy("Could not upload that image. Try again."), 'error');
    } catch (e) {
      alert(copy("Upload failed"), copy("Could not upload that image. Try again."), 'error');
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  };

  const handleSetupPayouts = async () => {
    setBusy(true);
    try {
      const url = await startConnectOnboarding();
      if (url) { await WebBrowser.openBrowserAsync(url); await load(); }
    } catch (e) {
      alert(copy("Error"), copy("Could not start payout setup."), 'error');
    } finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!amountValid) { alert(copy("Check the amount"), amountError || copy("Enter an amount to withdraw."), 'pending'); return; }
    if (!docsComplete) { alert(copy("Documents required"), copy("Please upload all {{value0}} documents.", {value0: slots.length}), 'pending'); return; }
    setBusy(true);
    try {
      await createWithdrawal({ amountCoins: coins, documents: docs });
      setAmount(''); setDocs({}); setTouched(false);
      alert(copy("Request submitted"), copy(settings?.processingText) || copy("Your withdrawal is under review."), 'success', copy('OK'), load);
    } catch (e) {
      alert(copy("Could not submit"), e?.response?.data?.message || copy("Please try again."), 'error');
    } finally { setBusy(false); }
  };

  const handleProceed = async (id) => {
    setBusy(true);
    try {
      const res = await proceedWithdrawal(id);
      alert(copy("Payout sent!"), res?.message || copy("Your payout is on its way."), 'success', copy('OK'), load);
    } catch (e) {
      alert(copy("Payout failed"), e?.response?.data?.message || copy("Please try again."), 'error');
    } finally { setBusy(false); }
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackArrowIcon width={20} height={20} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{copy("Cash Out")}</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return <ScreenWrapper noBottomTabs><View style={styles.container}><Header /><View style={styles.center}><ActivityIndicator size="large" color="#32A6D8" /></View></View></ScreenWrapper>;
  }
  if (!settings?.enabled) {
    return <ScreenWrapper noBottomTabs><View style={styles.container}><Header /><View style={styles.center}><Icon name="lock-closed-outline" size={40} color="#CBD5E0" /><Text style={styles.muted}>{copy("Cash-out is currently unavailable.")}</Text></View></View></ScreenWrapper>;
  }

  const pending = cfg?.pendingWithdrawal;
  const balCents = Math.round((cashable / settings.coinsPerDollar) * 100);

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <Header />
        <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={iosKeyboardDismissMode} bottomOffset={24}>
          {/* Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{copy("Available to withdraw")}</Text>
            <Text style={styles.balanceValue}>{money(balCents)}</Text>
            <View style={styles.balancePill}>
              <Icon name="server-outline" size={12} color="#FFFFFF" />
              <Text style={styles.balancePillText}>{cashable}{" " + copy("TreatCoins ·") + " "}{settings.coinsPerDollar}{" " + copy("TreatCoins = $1")}</Text>
            </View>
          </View>

          {pending ? (
            /* ===== Existing request ===== */
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{copy("Your withdrawal")}</Text>
                <StatusBadge status={pending.status} />
              </View>
              <View style={styles.hr} />
              <Breakdown bd={pending} feePercent={settings.feePercent} />
              {pending.status === 'PENDING' && <Text style={styles.processing}>{copy(settings.processingText)}</Text>}
              {pending.status === 'APPROVED' && (
                <PrimaryButton icon="cash-outline" label={copy("Withdraw {{value0}} now", {value0: money(pending.netCents)})} onPress={() => handleProceed(pending.id)} busy={busy} />
              )}
            </View>
          ) : !cfg.connect?.payoutsEnabled ? (
            /* ===== Payout setup ===== */
            <View style={styles.card}>
              <View style={styles.setupIcon}><Icon name="business-outline" size={26} color="#32A6D8" /></View>
              <Text style={styles.setupTitle}>{copy("Set up payouts first")}</Text>
              <Text style={styles.setupText}>{copy("Link your bank securely through Stripe. Stripe verifies your identity and bank details — it only takes a minute.")}</Text>
              <PrimaryButton label={copy("Set up payouts")} onPress={handleSetupPayouts} busy={busy} />
            </View>
          ) : (
            /* ===== New request ===== */
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{copy("Withdraw amount")}</Text>
                <View style={[styles.amountRow, (touched && amountError) && styles.amountRowError]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#CBD5E0"
                    keyboardType="number-pad"
                    value={amount}
                    onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, '')); }}
                    onBlur={() => setTouched(true)}
                    maxLength={9}
                  />
                  <Text style={styles.coinsSuffix}>TreatCoins</Text>
                  <TouchableOpacity onPress={() => { setAmount(String(cashable)); }} style={styles.maxBtn}>
                    <Text style={styles.maxText}>{copy('MAX')}</Text>
                  </TouchableOpacity>
                </View>
                {amountValid
                  ? <Text style={styles.amountSub}>= {money(bd.grossCents)}</Text>
                  : (amountError ? <Text style={styles.errText}><Icon name="alert-circle" size={13} color="#E53D3D" /> {amountError}</Text>
                    : <Text style={styles.amountSub}>{copy("Min") + " "}{money(settings.minWithdrawalCents)} · {minCoins} TreatCoins</Text>)}

                {amountValid && (
                  <>
                    <View style={styles.hr} />
                    <Breakdown bd={bd} feePercent={settings.feePercent} />
                  </>
                )}
              </View>

              {/* Documents */}
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{copy("Identity documents")}</Text>
                  <Text style={[styles.docCount, docsComplete && { color: '#2E9E5B' }]}>{docsDone}/{slots.length}</Text>
                </View>
                <Text style={styles.hint}>{copy("Required for every withdrawal.")}</Text>
                <View style={styles.docsRow}>
                  {slots.map((s) => (
                    <TouchableOpacity key={s.key} style={[styles.docSlot, docs[s.key] && styles.docSlotDone]} onPress={() => pickDoc(s.key)} disabled={uploading[s.key]} activeOpacity={0.8}>
                      {uploading[s.key] ? <ActivityIndicator size="small" color="#32A6D8" />
                        : docs[s.key] ? <Image source={{ uri: docs[s.key] }} style={styles.docThumb} />
                        : <Icon name="camera-outline" size={22} color="#32A6D8" />}
                      {!docs[s.key] && !uploading[s.key] && <Text style={styles.docLabel}>{copy(s.label)}</Text>}
                      {docs[s.key] && <View style={styles.docCheck}><Icon name="checkmark" size={12} color="#FFF" /></View>}
                    </TouchableOpacity>
                  ))}
                </View>
                {touched && !docsComplete && <Text style={styles.errText}><Icon name="alert-circle" size={13} color="#E53D3D" />{" " + copy("Upload all") + " "}{slots.length}{" " + copy("documents.")}</Text>}
              </View>

              <PrimaryButton label={copy("Submit request")} onPress={handleSubmit} busy={busy} disabled={!canSubmit} />
              <Text style={styles.processing}>{copy(settings.processingText)}</Text>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Text style={styles.sectionTitle}>{copy("History")}</Text>
              {history.map((h) => (
                <View key={h.id} style={styles.histRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histAmount}>{money(h.netCents)}</Text>
                    <Text style={styles.histSub}>{h.amountCoins}{" " + copy("TreatCoins ·") + " "}{new Date(h.createdAt).toLocaleDateString(displayLocale())}</Text>
                  </View>
                  <StatusBadge status={h.status} />
                </View>
              ))}
            </View>
          )}
        </KeyboardAwareScrollView>
      </View>
    </ScreenWrapper>
  );
}

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return <View style={[styles.badge, { backgroundColor: m.bg }]}><Text style={[styles.badgeText, { color: m.color }]}>{copy(m.label)}</Text></View>;
};

const PrimaryButton = ({ label, icon, onPress, busy, disabled }) => (
  <TouchableOpacity style={[styles.primaryBtn, disabled && styles.btnDisabled]} onPress={onPress} disabled={disabled || busy} activeOpacity={0.85}>
    {busy ? <ActivityIndicator color="#FFF" />
      : <>{icon ? <Icon name={icon} size={18} color="#FFF" /> : null}<Text style={styles.primaryText}>{label}</Text></>}
  </TouchableOpacity>
);

const Breakdown = ({ bd, feePercent }) => (
  <View>
    <Row label={copy("Withdrawal amount")} value={money(bd.grossCents)} />
    <Row label={copy("Flat fee")} value={`− ${money(bd.flatFeeCents)}`} red />
    <Row label={copy("Service fee{{value0}}", {value0: feePercent != null ? ` (${feePercent}%)` : ''})} value={`− ${money(bd.percentFeeCents)}`} red />
    <View style={styles.hr} />
    <Row label={copy("You'll receive")} value={money(bd.netCents)} bold />
  </View>
);

const Row = ({ label, value, red, bold }) => (
  <View style={styles.brRow}>
    <Text style={[styles.brLabel, bold && styles.brLabelBold]}>{label}</Text>
    <Text style={[styles.brValue, red && styles.brValueRed, bold && styles.brValueBold]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#0D0D12', fontSize: 16, fontFamily: 'Poppins', fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 10 },
  muted: { color: '#818898', fontSize: 14, fontFamily: 'Poppins' },

  balanceCard: { backgroundColor: '#32A6D8', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Poppins' },
  balanceValue: { color: '#FFFFFF', fontSize: 34, fontFamily: 'Poppins', fontWeight: '700', marginTop: 2 },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  balancePillText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins', fontWeight: '500' },

  card: { borderWidth: 1, borderColor: '#EDEFF3', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hr: { height: 1, backgroundColor: '#F0F2F5', marginVertical: 12 },
  hint: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', marginTop: 3 },

  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, borderWidth: 1.5, borderColor: '#EDEFF3', borderRadius: 12, paddingHorizontal: 14, height: 58 },
  amountRowError: { borderColor: '#F5B5B5' },
  amountInput: { flex: 1, fontSize: 26, fontFamily: 'Poppins', fontWeight: '700', color: '#0D0D12', padding: 0 },
  coinsSuffix: { color: '#818898', fontSize: 14, fontFamily: 'Poppins', marginRight: 10 },
  maxBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(50,166,216,0.12)' },
  maxText: { color: '#32A6D8', fontSize: 12, fontFamily: 'Poppins', fontWeight: '700' },
  amountSub: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', marginTop: 8 },
  errText: { color: '#E53D3D', fontSize: 12.5, fontFamily: 'Poppins', fontWeight: '500', marginTop: 8 },

  brRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  brLabel: { color: '#5B6B7B', fontSize: 14, fontFamily: 'Poppins' },
  brLabelBold: { color: '#0D0D12', fontWeight: '700' },
  brValue: { color: '#0D0D12', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500' },
  brValueRed: { color: '#E53D3D' },
  brValueBold: { color: '#2E9E5B', fontWeight: '700', fontSize: 18 },

  docCount: { color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '600' },
  docsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  docSlot: { flex: 1, height: 90, borderRadius: 12, borderWidth: 1.5, borderColor: '#E4E8EE', borderStyle: 'dashed', backgroundColor: '#FAFBFC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  docSlotDone: { borderStyle: 'solid', borderColor: '#3FA477' },
  docThumb: { ...StyleSheet.absoluteFillObject },
  docLabel: { color: '#818898', fontSize: 10.5, fontFamily: 'Poppins', marginTop: 6, textAlign: 'center' },
  docCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#3FA477', justifyContent: 'center', alignItems: 'center' },

  setupIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(50,166,216,0.10)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  setupTitle: { color: '#0D0D12', fontSize: 16, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center', marginTop: 12 },
  setupText: { color: '#818898', fontSize: 13, fontFamily: 'Poppins', lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 4 },

  primaryBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#32A6D8', height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14, width: '100%' },
  btnDisabled: { backgroundColor: '#B9DEF1' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  processing: { color: '#A0AEC0', fontSize: 12, fontFamily: 'Poppins', textAlign: 'center', marginTop: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '600' },
  sectionTitle: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600', marginBottom: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDEFF3', borderRadius: 12, padding: 12, marginBottom: 8 },
  histAmount: { color: '#0D0D12', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  histSub: { color: '#818898', fontSize: 11, fontFamily: 'Poppins', marginTop: 2 },
});

