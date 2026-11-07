import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { CURRENCIES, resolveCurrency, formatUSD } from '../../i18n/preferences';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { Button } from '../../components';
import TreatCoinMark from '../../components/TreatCoinMark';
import StripeCardSheet from '../../components/StripeCardSheet';
import api from '../../config/api';
import { useAppAlert } from '../../context/AlertContext';
import { usePaymentConfig } from '../../context/PaymentConfigContext';
import { useWallet } from '../../context/WalletContext';

// Format priceInCents → "$24.99"
const formatPrice = formatUSD;

export default function ShopCoinsScreen({ navigation }) {
  const { t } = useTranslation();
  const [currencyPreference, setCurrencyPreference] = useState('system');
  const [currencyReady, setCurrencyReady] = useState(false);
  const [currencyError, setCurrencyError] = useState(false);
  const preferredCurrency = resolveCurrency(currencyPreference, Localization.getLocales?.() || []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('@oktreat_currency').then(value => { if (active) setCurrencyPreference(CURRENCIES.includes(value) ? value : 'system'); }).catch(() => {}).finally(() => { if (active) setCurrencyReady(true); });
    return () => { active = false; };
  }, []);
  const chooseCurrency = async value => {
    try { await AsyncStorage.setItem('@oktreat_currency', value); setCurrencyPreference(value); setCurrencyError(false); }
    catch { setCurrencyError(true); }
  };
  const alert = useAppAlert();
  const { mode, publishableKey } = usePaymentConfig();
  const wallet = useWallet();

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [showCardSheet, setShowCardSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Track whether the screen is still mounted. Without this, a slow
  // post-payment polling loop can call setState after the user navigates
  // away from Shop Coins — which throws and on some devices kills the
  // whole RN bridge. Tester reported a hard crash here.
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const handleBack = () => navigation.goBack();

  const fetchBalance = useCallback(async () => {
    try {
      const response = await api.get('/coins/balance');
      const data = response.data?.data || response.data || {};
      setBalance(Number(data.coinBalance || 0));
    } catch (err) {
      console.warn('Error fetching TreatCoin balance:', err?.message);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const response = await api.get('/coins/packages');
      const data = response.data?.data || response.data || {};
      const list = data.packages || [];
      setPackages(list);
      // Default-select the second package (a common "good middle option")
      // unless there are fewer.
      if (list.length > 0) {
        setSelectedPackageId(list[Math.min(1, list.length - 1)].id);
      }
    } catch (err) {
      console.warn('Error fetching packages:', err?.message);
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchPackages();
  }, [fetchBalance, fetchPackages]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Called by StripeCardSheet when the user taps Pay. We create the
  // PaymentIntent at this moment (not at sheet-open) so abandoned sheets
  // don't litter Stripe with unconfirmed intents. Returns the clientSecret
  // for the SDK's confirmPayment call.
  const requestPaymentIntent = async () => {
    if (!selectedPackage) {
      return { message: 'Please select a package.' };
    }
    try {
      const response = await api.post('/coins/purchase', { packageId: selectedPackage.id });
      const data = response.data?.data || {};
      if (!data.clientSecret) {
        return { message: response.data?.message || 'Server did not return a clientSecret.' };
      }
      return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
    } catch (err) {
      console.error('Purchase error:', err);
      return { message: err.response?.data?.message || 'Failed to start purchase.' };
    }
  };

  // After Stripe confirms the charge, the backend webhook credits the user.
  // The webhook is async, so we poll the balance for a few seconds until it
  // increases. The card sheet stays closed at this point.
  //
  // Defensive layout (tester reported a hard crash here on Android):
  //   1. mounted-guard on every setState so a back-nav during the 12s poll
  //      can't throw "setState on unmounted component" and kill the bridge
  //   2. wallet.refresh() in try/catch — context update during a teardown
  //      window has been seen to crash the native screen container
  //   3. success alert deferred behind setTimeout(300) so the Stripe Modal
  //      has time to fully animate out before our ProfileVerifiedModal
  //      mounts. Two RN Modals in flight at once is a known Android crash.
  //   4. Final outer try/catch — if anything still throws, surface a
  //      simple message and don't tear down the screen.
  const handlePaymentConfirmed = async () => {
    setShowCardSheet(false);
    setConfirming(true);
    const expectedDelta = selectedPackage
      ? selectedPackage.coins + (selectedPackage.bonusCoins || 0)
      : 0;
    const before = balance;

    let credited = false;
    try {
      for (let attempt = 0; attempt < 8 && !credited; attempt++) {
        // Webhook usually lands within 1–3 seconds; we poll up to ~12s.
        await new Promise((r) => setTimeout(r, 1500));
        if (!isMountedRef.current) return; // user navigated away — bail
        try {
          const response = await api.get('/coins/balance');
          const data = response.data?.data || {};
          const newBalance = Number(data.coinBalance || 0);
          if (!Number.isNaN(newBalance) && isMountedRef.current) {
            setBalance(newBalance);
            if (newBalance >= before + expectedDelta) credited = true;
          }
        } catch (e) {
          // Transient — keep polling.
        }
      }

      if (!isMountedRef.current) return;
      setConfirming(false);

      // Propagate to other screens via WalletContext. Crash here would be
      // rare but has been seen during teardown — wrap defensively.
      try { wallet.refresh?.(); } catch (e) {
        console.warn('wallet.refresh failed:', e?.message);
      }

      // Defer the modal so Stripe's modal can finish dismissing first.
      // Two simultaneous Modals on Android occasionally hard-crash the
      // native UIManager.
      const showSuccess = () => {
        if (!isMountedRef.current) return;
        try {
          if (credited) {
            alert('Success', `${expectedDelta} TreatCoins added to your account.`, 'success');
          } else {
            alert(
              'Payment received',
              'Your payment was charged. TreatCoins will appear in your balance shortly.',
              'success',
            );
          }
        } catch (e) {
          // Custom alert layer threw — log and move on. The payment still
          // went through; the user can refresh to see the updated balance.
          console.warn('Success alert failed to render:', e?.message);
        }
      };
      setTimeout(showSuccess, 300);
    } catch (outer) {
      // Catch-all so a transient native hiccup can't take down the screen.
      console.error('handlePaymentConfirmed crashed:', outer?.message || outer);
      if (isMountedRef.current) setConfirming(false);
    }
  };

  const stripeReady = !!publishableKey;
  const canPay = !!selectedPackage && stripeReady && !confirming;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back">
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance */}
          <View style={styles.totalCoinsSection}>
            <Image
              source={require('../../assets/images/treatcoins-logo.png')}
              style={styles.treatCoinsLogo}
              resizeMode="contain"
              accessibilityLabel="TreatCoins"
            />
            <Text style={styles.totalCoinsAmount}>
              {balanceLoading ? '...' : balance.toLocaleString()}
            </Text>
            <Text style={styles.totalCoinsLabel}>{t('shop.balance')}</Text>
          </View>

          <View style={styles.currencySection}>
            <Text style={styles.currencyTitle}>{t('preferences.currency')}</Text>
            <View style={styles.currencyOptions}>
              {['system', ...CURRENCIES].map(value => <TouchableOpacity key={value} disabled={!currencyReady} accessibilityRole="radio" accessibilityState={{ selected: currencyPreference === value }} onPress={() => chooseCurrency(value)} style={[styles.currencyOption, currencyPreference === value && styles.currencyOptionSelected]}>
                <Text style={styles.currencyOptionText}>{value === 'system' ? t('preferences.phoneRegion') : value}</Text>
              </TouchableOpacity>)}
            </View>
            <Text style={styles.currencyNote}>{preferredCurrency === 'USD' ? t('shop.usdOnly') : t('shop.localPending', { currency: preferredCurrency })}</Text>
            {currencyError && <Text style={styles.currencyNote}>{t('preferences.saveError')}</Text>}
          </View>

          {/* Test-mode banner */}
          {mode === 'test' && (
            <View style={styles.testBanner}>
              <Text style={styles.testBannerText}>
                TEST MODE — test cards (4242 4242 4242 4242) are accepted; real cards are not charged.
              </Text>
            </View>
          )}

          {/* Packages */}
          <View style={styles.packagesSection}>
            {packagesLoading ? (
              <View style={styles.packagesLoading}>
                <ActivityIndicator color="#32A6D8" />
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.packagesLoading}>
                <Text style={styles.emptyText}>{t('shop.noPackages')}</Text>
              </View>
            ) : (
              packages.map((pkg) => {
                const selected = selectedPackageId === pkg.id;
                const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.packageCard, selected && styles.packageCardSelected]}
                    onPress={() => setSelectedPackageId(pkg.id)}
                  >
                    <View style={styles.packageLeft}>
                      <Text style={styles.packagePrice}>{formatPrice(pkg.priceInCents)}</Text>
                      {pkg.bonusCoins > 0 && (
                        <Text style={styles.bonusText}>{t('shop.bonus', { amount: pkg.bonusCoins })}</Text>
                      )}
                    </View>
                    <View style={styles.packageCoins}>
                      <TreatCoinMark size={20} />
                      <Text style={styles.packageCoinsText}>
                        {totalCoins.toLocaleString()} TreatCoins
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title={
              confirming
                ? t('shop.crediting')
                : !stripeReady
                ? t('shop.unavailable')
                : selectedPackage
                ? t('shop.pay', { amount: formatPrice(selectedPackage.priceInCents) })
                : t('shop.select')
            }
            onPress={() => setShowCardSheet(true)}
            fullWidth
            size="medium"
            type="secondary"
            style={styles.payButton}
            textStyle={styles.payButtonText}
            disabled={!canPay}
          />
        </View>

        <StripeCardSheet
          visible={showCardSheet}
          onClose={() => setShowCardSheet(false)}
          amountLabel={selectedPackage ? formatPrice(selectedPackage.priceInCents) : 'US$0.00'}
          fetchClientSecret={requestPaymentIntent}
          onSuccess={handlePaymentConfirmed}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  totalCoinsSection: { alignItems: 'center', marginBottom: 32 },
  treatCoinsLogo: {
    width: 180,
    height: 164,
    marginBottom: 8,
  },
  payButton: { backgroundColor: '#087EA4', borderColor: '#087EA4' },
  payButtonText: { color: '#FFFFFF', fontWeight: '700' },
  totalCoinsAmount: {
    color: 'black',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 32,
    textAlign: 'center',
  },
  totalCoinsLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '350',
    lineHeight: 18.6,
    textAlign: 'center',
  },
  testBanner: {
    backgroundColor: '#FEF5E7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  testBannerText: {
    fontSize: 12,
    color: '#8C5A0E',
    fontFamily: 'Avenir LT Std',
    fontWeight: '500',
  },
  currencySection: { marginBottom: 20, gap: 8 },
  currencyTitle: { fontSize: 14, fontWeight: '600', color: '#142D38' },
  currencyOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#DFE7EB' },
  currencyOptionSelected: { backgroundColor: '#E2F3F5', borderColor: '#087EA4' },
  currencyOptionText: { color: '#142D38', fontWeight: '600' },
  currencyNote: { color: '#526571', fontSize: 12, lineHeight: 18 },
  packagesSection: { gap: 10 },
  packagesLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#818898',
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
  packageCard: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageCardSelected: {
    borderWidth: 2,
    borderColor: '#087EA4',
  },
  packageLeft: { gap: 4 },
  packagePrice: {
    color: '#090E12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  bonusText: {
    color: '#3FA477',
    fontSize: 11,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
  },
  packageCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.88,
  },
  packageCoinsText: {
    color: '#32A6D8',
    fontSize: 13.76,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.34,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});
