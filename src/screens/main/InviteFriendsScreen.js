import { copy, useCopyUpdates } from '../../i18n/copy';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as Clipboard from 'expo-clipboard';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import api from '../../config/api';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { useDispatch } from 'react-redux';
import { loadRemoteConfig } from '../../store/slices/appSlice';

export default function InviteFriendsScreen({ navigation }) {
  useCopyUpdates();
  const { user } = useSelector((state) => state.auth);
  // Store links come from the admin-editable remote config so they can change
  // without an app update. Empty links are simply omitted from the message.
  const { playStoreUrl, appStoreUrl } = useRemoteConfig();
  const dispatch = useDispatch();
  const [stats, setStats] = useState(null);
  const referrerReward = stats?.rewardAmounts?.referrerReward ?? 100;
  const referredReward = stats?.rewardAmounts?.referredReward ?? 100;
  const [copied, setCopied] = useState(false);
  const copiedProgress = useRef(new Animated.Value(0)).current;
  const copyTimer = useRef(null);

  const code = stats?.referralCode || user?.referralCode || '';

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/auth/referral-stats');
      setStats(res.data?.data || null);
    } catch (e) {
      // leave stats null — code still comes from redux user
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchStats();
    dispatch(loadRemoteConfig());
  }, [fetchStats, dispatch]));

  useEffect(() => {
    Animated.timing(copiedProgress, {
      toValue: copied ? 1 : 0,
      duration: copied ? 180 : 130,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [copied, copiedProgress]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copiedProgress.setValue(0);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 1000);
    } catch {
      // Keep the referral screen usable if the platform clipboard is unavailable.
    }
  };

  const handleShare = async () => {
    if (!code) return;
    // Append whichever store links the admin has configured. Both are omitted
    // if empty so the message never carries a broken "download" line.
    const links = [
      (appStoreUrl || '').trim() && `iOS: ${appStoreUrl.trim()}`,
      (playStoreUrl || '').trim() && `Android: ${playStoreUrl.trim()}`,
    ].filter(Boolean);
    const downloadBlock = links.length ? `\n\n${copy('Download OkTreat:')}\n${links.join('\n')}` : '';
    try {
      await Share.share({
        message:
          copy('Join me on OkTreat — the app for trusted pet sitters! 🐾') + '\n\n' +
          copy('Use my referral code {{code}}.', {code}) + ' ' +
          copy('Verify your account and apply my code to get {{friend}} bonus TreatCoins. I get {{inviter}} TreatCoins too. Promotional TreatCoins cannot be withdrawn as cash.', {friend:referredReward, inviter:referrerReward}) +
          downloadBlock,
      });
    } catch (e) { /* dismissed */ }
  };

  const invited = stats?.totalReferrals ?? 0;
  const earned = stats?.totalRewards ?? 0;

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy("Invite Friends")}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <Icon name="gift" size={28} color="#32A6D8" />
            <Text style={styles.heroTitle}>{copy('Give {{friend}}, get {{inviter}}', { friend: referredReward, inviter: referrerReward })}</Text>
            <Text style={styles.heroSubtitle}>
              {copy("Your friend gets {{friend}} bonus TreatCoins and you get {{inviter}} TreatCoins when they verify their account and apply your referral code. One referral reward per account. Promotional TreatCoins cannot be withdrawn as cash.", { friend: referredReward, inviter: referrerReward })}
            </Text>
          </View>

          {/* Code + actions */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>{copy("YOUR CODE")}</Text>
            <View style={styles.codeRow}>
              <Text style={styles.code} numberOfLines={1} selectable>{code || '—'}</Text>
              <View style={styles.copyAction}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.copyToast,
                    {
                      opacity: copiedProgress,
                      transform: [{ translateY: copiedProgress.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.copyToastText}>{copy('Copied!')}</Text>
                </Animated.View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} disabled={!code} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Animated.View style={{ transform: [
                    { perspective: 500 },
                    { rotateY: copiedProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '180deg'] }) },
                    { scale: copiedProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.72, 1] }) },
                  ] }}>
                    <Icon name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? '#2F9B68' : '#32A6D8'} />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={!code}>
            <Icon name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.shareText}>{copy("Share invite")}</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{invited}</Text>
              <Text style={styles.statLabel}>{copy("Invited")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{earned}</Text>
              <Text style={styles.statLabel}>{copy("TreatCoins earned")}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'black', fontSize: 16, fontFamily: 'Poppins', fontWeight: '500', lineHeight: 24.8 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#0D0D12', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', marginTop: 8 },
  heroSubtitle: {
    color: '#818898', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 12,
  },
  codeCard: {
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: '#FAFCFF',
  },
  codeLabel: { color: '#818898', fontSize: 11, fontFamily: 'Poppins', fontWeight: '600', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  code: { flex: 1, color: '#32A6D8', fontSize: 24, fontFamily: 'Poppins', fontWeight: '700', letterSpacing: 3 },
  copyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(90,172,244,0.12)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  copyAction: { position: 'relative', marginLeft: 8 },
  copyToast: { position: 'absolute', bottom: 46, right: -12, zIndex: 2, backgroundColor: '#173342', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, minWidth: 66, alignItems: 'center' },
  copyToastText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins', fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#32A6D8', height: 52, borderRadius: 26, marginTop: 14,
  },
  shareText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 14, marginTop: 20, paddingVertical: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#EBEBEB' },
  statValue: { color: '#0D0D12', fontSize: 22, fontFamily: 'Poppins', fontWeight: '700' },
  statLabel: { color: '#818898', fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', marginTop: 2 },
});

