import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { createIdentitySession, getIdentityStatus } from '../services/stripeService';

// Never use cached avatar, card verification or local form state as identity proof.
export const identityConfirmed = response => response?.success === true && response?.data?.verified === true && response?.data?.status === 'verified';
export const stripeIdentityUrl = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'verify.stripe.com'; } catch { return false; }
};
export default function PalsIdentityVerification() {
  const [status, setStatus] = useState('checking');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const check = async () => {
    const response = await getIdentityStatus();
    if (!response?.success) throw new Error('Could not confirm identity status');
    if (mounted.current) setStatus(identityConfirmed(response) ? 'verified' : response.data?.status === 'processing' ? 'processing' : 'unverified');
    return identityConfirmed(response);
  };
  useEffect(() => {
    mounted.current = true;
    check().catch(() => { if (mounted.current) setStatus('unavailable'); });
    return () => { mounted.current = false; };
  }, []);
  const start = () => Alert.alert('Verify your identity', 'Stripe will ask for your government-issued photo ID and a camera selfie. This checks your identity; it does not verify your Pals gallery photos. Continue only if you want to submit these details to Stripe.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue to Stripe', onPress: async () => {
      if (inFlight.current || !mounted.current) return;
      inFlight.current = true; setBusy(true);
      try {
        // Reuse a server-confirmed existing check before creating another session.
        if (await check()) return;
        const response = await createIdentitySession();
        if (!response?.success || !stripeIdentityUrl(response.data?.url)) throw new Error('Could not open secure identity verification');
        await WebBrowser.openBrowserAsync(response.data.url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, dismissButtonStyle: 'close', toolbarColor: '#FFFFFF', controlsColor: '#087EA4' });
        if (!mounted.current) return;
        if (!(await check())) Alert.alert('Verification not yet confirmed', 'If you submitted your details, Stripe may still be reviewing them. Tap Check status to refresh. Closing the camera or browser does not complete verification.');
      } catch (error) {
        if (mounted.current) { setStatus('unavailable'); Alert.alert('Could not verify', error?.message || 'Please try again later.'); }
      } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
    } },
  ]);
  const refresh = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try { await check(); } catch { if (mounted.current) setStatus('unavailable'); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const confirmed = status === 'verified';
  return <View style={{ padding: 16, backgroundColor: '#EEF7FB', borderRadius: 16, gap: 10 }}>
    <Text style={{ color: '#173342', fontSize: 17, fontWeight: '800' }}>{confirmed ? 'Identity check completed' : 'Verify your profile'}</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: '#365463', lineHeight: 21 }}>{status === 'checking' ? 'Checking your existing identity verification…' : confirmed ? 'Your existing identity check is confirmed by the server. You do not need to repeat it here.' : status === 'processing' ? 'Your identity check is being reviewed.' : status === 'unavailable' ? 'We could not confirm your identity status. Please check again.' : 'Complete a government ID and selfie check on your phone through Stripe.'}</Text>
    {!confirmed && <TouchableOpacity accessibilityRole="button" disabled={busy || status === 'checking'} onPress={status === 'processing' ? refresh : start} style={{ minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: busy || status === 'checking' ? '#9EBAC6' : '#087EA4', alignItems: 'center' }}><Text style={{ color: '#FFF', fontWeight: '700' }}>{busy ? 'Please wait…' : status === 'processing' ? 'Check status' : 'Verify your profile'}</Text></TouchableOpacity>}
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={refresh} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#087EA4', fontWeight: '700' }}>Check status</Text></TouchableOpacity>
    <Text style={{ color: '#486371', fontSize: 13, lineHeight: 20 }}>Identity verification is separate from photo verification and is not a guarantee of safety. Pals invitations and real meetups are not enabled in this preview.</Text>
  </View>;
}
