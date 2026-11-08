import { copy, useCopyUpdates } from '../../i18n/copy';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUSD, formatCharge } from '../../i18n/preferences';
import { useFocusEffect } from '@react-navigation/native';
import { getPaymentMarket, countryName } from '../../services/paymentCountryService';
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
  useCopyUpdates();
  const { t, i18n } = useTranslation();
  const [market, setMarket] = useState(null);
  const [priceError, setPriceError] = useState('');
  const [clock, setClock] = useState(Date.now());
  const priceEpoch = useRef(0);
  const displayPrice = pkg => formatCharge(pkg.amount, pkg.currency, i18n.language);
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
    const epoch = ++priceEpoch.current;
    setPackagesLoading(true); setPriceError(''); setPackages([]); setSelectedPackageId(null); setMarket(null);
    try {
      const currentMarket = await getPaymentMarket();
      if (epoch !== priceEpoch.current) return;
      setMarket(currentMarket);
      if (!currentMarket.isConfirmed) return;
      const response = await api.get('/coins/packages', { params: { localized: '1' }, timeout: 25000 });
      if (epoch !== priceEpoch.current) return;
      const data = response.data?.data;
      const list = data?.packages || [];
      if (!list.every(pkg => pkg.currency === data.market?.currency && Number.isSafeInteger(pkg.amount) && pkg.amount > 0 && pkg.quoteToken && Number.isFinite(pkg.expiresAt))) throw new Error('Invalid price response');
      setMarket(data.market); setPackages(list); setClock(Date.now());
      if (list.length) setSelectedPackageId(list[Math.min(1, list.length - 1)].id);
    } catch {
      if (epoch === priceEpoch.current) setPriceError(copy('Could not load local prices. Please try again.'));
    } finally { if (epoch === priceEpoch.current) setPackagesLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchBalance(); fetchPackages();
    const timer = setInterval(() => setClock(Date.now()), 15000);
    return () => { priceEpoch.current++; clearInterval(timer); };
  }, [fetchBalance, fetchPackages]));

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Called by StripeCardSheet when the user taps Pay. We create the
  // PaymentIntent at this moment (not at sheet-open) so abandoned sheets
  // don't litter Stripe with unconfirmed intents. Returns the clientSecret
  // for the SDK's confirmPayment call.
  const requestPaymentIntent = async () => {
    if (!selectedPackage) {
      return { message: copy('Please select a package.') };
    }
    try {
      if (selectedPackage.expiresAt <= Date.now()) return { message: copy('This price has expired. Close payment and refresh prices before paying.') };
      const response = await api.post('/coins/purchase', { packageId: selectedPackage.id, localized: true, quoteToken: selectedPackage.quoteToken });
      const data = response.data?.data || {};
      if (!data.clientSecret) {
        return { message: response.data?.message || 'Server did not return a clientSecret.' };
      }
      if (data.amount !== selectedPackage.amount || data.currency !== selectedPackage.currency) return { message: copy('The payment total changed. Please close payment and refresh prices.') };
      return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
    } catch (err) {
      if (err.response?.status === 409) { setShowCardSheet(false); setPriceError(copy('Prices changed. Please refresh and review the new total before paying.')); }
      console.error('Purchase error:', err?.message);
      return { message: err.response?.data?.message || copy('Failed to start purchase.') };
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
            alert(copy('Success'), copy('{{amount}} TreatCoins added to your account.', { amount: expectedDelta }), 'success');
          } else {
            alert(
              copy('Payment received'),
              copy('Your payment was charged. TreatCoins will appear in your balance shortly.'),
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
  const quoteExpired = !!selectedPackage && selectedPackage.expiresAt <= clock;
  const canPay = !!selectedPackage && market?.isConfirmed && !packagesLoading && !quoteExpired && stripeReady && !confirming;

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

          {!!market && <Text style={styles.currencyNote}>{copy('Payment country: {{country}} · {{currency}}', { country: countryName(market.country, i18n.language), currency: market.currency })}</Text>}
          {market && !market.isConfirmed && <Button title={copy('Confirm currency')} onPress={() => navigation.navigate('PaymentCountry')} fullWidth/>}
          {!!priceError && <Text accessibilityRole="alert" style={styles.currencyNote}>{priceError}</Text>}
          {(priceError || quoteExpired) && <Button title={copy('Refresh prices')} onPress={fetchPackages} fullWidth/>}
          {quoteExpired && <Text style={styles.currencyNote}>{copy('This price has expired. Refresh prices before paying.')}</Text>}
          {selectedPackage && !quoteExpired && <Text style={styles.currencyNote}>{copy('Converted from USD using daily reference rates. The displayed price is locked for 10 minutes.')}</Text>}
          {selectedPackage && ['https://frankfurter.dev', 'https://www.exchangerate-api.com'].includes(selectedPackage.rateSource) && <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(selectedPackage.rateSource).catch(() => {})}><Text style={[styles.currencyNote, { color: '#087EA4', textDecorationLine: 'underline' }]}>{selectedPackage.rateSource === 'https://www.exchangerate-api.com' ? 'Rates By Exchange Rate API' : copy('Exchange-rate source')}</Text></TouchableOpacity>}

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
            ) : packages.length === 0 && market?.isConfirmed && !priceError ? (
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
                      <Text style={styles.packagePrice}>{displayPrice(pkg)}</Text>
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
                ? t('shop.pay', { amount: displayPrice(selectedPackage) })
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
          amountLabel={selectedPackage ? displayPrice(selectedPackage) : '—'}
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
  currencyNote: { color: '#526571', fontSize: 12, lineHeight: 18, marginBottom: 16 },
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
