import { copy, useCopyUpdates } from '../../../i18n/copy';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Button from '../../../components/Button';
import Icon from '@expo/vector-icons/Ionicons';
import { BackArrowIcon, ShieldCheckIcon } from '../../../assets';
import { createIdentitySession, getIdentityStatus } from '../../../services/stripeService';

const HORIZONTAL_PADDING = 24;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function VerifyIdentityScreen({ navigation }) {
  useCopyUpdates();
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const markVerified = async () => {
    const updatedUser = { ...user, stripeVerified: true };
    dispatch(setCredentials({ user: updatedUser, token }));
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setShowSuccessModal(true);
  };

  // After the hosted browser closes, Stripe may still be "processing". Poll a
  // few times before concluding. The webhook is the async backstop.
  const pollStatus = async () => {
    let last = null;
    for (let i = 0; i < 6; i++) {
      try {
        const res = await getIdentityStatus();
        last = res?.data;
        if (last?.verified) { await markVerified(); return; }
        if (last?.status === 'canceled') {
          setErrorMessage('Verification was cancelled. You can try again any time.');
          setShowErrorModal(true);
          return;
        }
      } catch (_) {
        // transient — keep polling
      }
      await sleep(2000);
    }
    if (last?.status === 'processing') {
      // Documents submitted, Stripe still reviewing. Let them proceed; the
      // submit step stays locked until verification completes.
      setShowProcessingModal(true);
    } else {
      setErrorMessage('Verification wasn\'t completed. Please finish all the steps and try again.');
      setShowErrorModal(true);
    }
  };

  const startVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await createIdentitySession();
      if (!res?.success || !res?.data?.url) {
        throw new Error(res?.message || 'Could not start verification');
      }
      // Opens Stripe's secure hosted verification page in an in-app browser;
      // resolves when the user returns to the app. Styled to match the brand:
      // iOS gets a card/sheet presentation; Android gets a branded Custom Tab
      // (Custom Tabs can't be a true bottom sheet). Camera works here, which it
      // wouldn't reliably in an embedded WebView.
      await WebBrowser.openBrowserAsync(res.data.url, {
        // iOS: slide-up card instead of full-screen
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        dismissButtonStyle: 'close', // iOS
        // Brand colors (iOS controls + Android toolbar)
        toolbarColor: '#FFFFFF',
        controlsColor: '#32A6D8',
        // Android Custom Tab polish
        showTitle: false,
        enableBarCollapsing: true,
      });
      await pollStatus();
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to start verification. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.replace('ProfileSetup');
  };

  const handleProcessingClose = () => {
    setShowProcessingModal(false);
    navigation.replace('ProfileSetup');
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isVerifying}>
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <View style={styles.top}>
            <View style={styles.iconCircle}>
              <ShieldCheckIcon width={32} height={32} fill="#FFFFFF" />
            </View>

            <Text style={styles.title}>Verify your Identity</Text>
            <Text style={styles.desc}>
              {copy("During sitter registration, Stripe Identity checks a government-issued photo ID and a matching selfie to help verify identity and support a safer community.")}
            </Text>
            <Text style={styles.desc}>
              {copy("Identity verification is not a criminal background check or a guarantee of conduct or pet-care ability. Review profiles, discuss your pet’s needs and arrange a meet-and-greet before booking.")}
            </Text>

            <View style={styles.badges}>
              {[
                { icon: 'card-outline', text: 'Government ID + selfie match' },
                { icon: 'lock-closed', text: copy("ID submitted through Stripe") },
                { icon: 'shield-checkmark', text: 'Powered by Stripe Identity' },
              ].map((item, i) => (
                <View key={i} style={styles.badgeRow}>
                  <View style={styles.badgeIcon}>
                    <Icon name={item.icon} size={16} color="#32A6D8" />
                  </View>
                  <Text style={styles.badgeText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottom}>
            <Button
              title={isVerifying ? 'Starting…' : 'Start Verification'}
              onPress={startVerification}
              type="primary"
              size="medium"
              fullWidth
              disabled={isVerifying}
            />
            <Text style={styles.requiredNote}>
              Identity verification is required to become a sitter.
            </Text>
          </View>
        </ScrollView>

        {/* Full-screen spinner while we open the session / poll */}
        {isVerifying && (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color="#32A6D8" />
            <Text style={styles.loadingText}>Preparing secure verification…</Text>
          </View>
        )}

        {/* Success */}
        <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleSuccessClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.successCircle}>
                <Icon name="checkmark" size={36} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>Identity Verified!</Text>
              <Text style={styles.modalMsg}>Your identity has been verified. You can now set up your sitter profile and submit for approval.</Text>
              <Button title="Continue" onPress={handleSuccessClose} type="primary" size="large" fullWidth />
            </View>
          </View>
        </Modal>

        {/* Processing */}
        <Modal visible={showProcessingModal} transparent animationType="fade" onRequestClose={handleProcessingClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.processingCircle}>
                <Icon name="time-outline" size={34} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>Verification in review</Text>
              <Text style={styles.modalMsg}>Thanks! Stripe is reviewing your documents. You can continue setting up your profile — you'll be able to submit for approval once it's verified (usually within a few minutes).</Text>
              <Button title="Continue" onPress={handleProcessingClose} type="primary" size="large" fullWidth />
            </View>
          </View>
        </Modal>

        {/* Error */}
        <Modal visible={showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.errorCircle}>
                <Icon name="close" size={30} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>Verification Incomplete</Text>
              <Text style={styles.modalMsg}>{errorMessage}</Text>
              <Button title="Try Again" onPress={() => { setShowErrorModal(false); startVerification(); }} type="primary" size="large" fullWidth />
              <TouchableOpacity onPress={() => setShowErrorModal(false)} style={styles.skipBtn}>
                <Text style={styles.skipText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 16, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  content: { flexGrow: 1, paddingHorizontal: HORIZONTAL_PADDING, justifyContent: 'space-between', paddingBottom: 36 },
  top: { alignItems: 'center', gap: 16, paddingTop: 8 },
  iconCircle: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#FFC2EB', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center' },
  desc: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '400', lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  badges: { gap: 10, width: '100%', marginTop: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F6FBFF', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8F4FD' },
  badgeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F4FD', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#0D0D12', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '600' },
  bottom: { gap: 12, alignItems: 'center' },
  requiredNote: { color: '#818898', fontSize: 12.5, fontFamily: 'Avenir LT Std', fontWeight: '500', textAlign: 'center' },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: '#F38FB4', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '750' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', gap: 14 },
  successCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  processingCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#32A6D8', justifyContent: 'center', alignItems: 'center' },
  errorCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', textAlign: 'center' },
  modalMsg: { color: '#818898', fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '400', lineHeight: 22, textAlign: 'center' },
});
