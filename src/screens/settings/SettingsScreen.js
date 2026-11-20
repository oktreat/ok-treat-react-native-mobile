import { copy, useCopyUpdates } from '../../i18n/copy';
import React from 'react';
import { Animated, Easing, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { logout } from '../../store/slices/authSlice';
import { clearPushTokenOnServer } from '../../services/notificationService';
import { getInformation } from './informationContent';
import api from '../../config/api';
import { useAppearance } from '../../context/AppearanceContext';

export default function SettingsScreen({ navigation }) {
  useCopyUpdates();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { dark, setDark } = useAppearance();
  const containerRef = React.useRef(null);
  const switchRef = React.useRef(null);
  const circleProgress = React.useRef(new Animated.Value(0)).current;
  const [circleTransition, setCircleTransition] = React.useState(null);

  const toggleDarkMode = (next) => {
    const container = containerRef.current;
    const toggle = switchRef.current;
    if (!container?.measureInWindow || !toggle?.measureInWindow) {
      setDark(next);
      return;
    }
    container.measureInWindow((containerX, containerY, width, height) => {
      toggle.measureInWindow((switchX, switchY, switchWidth, switchHeight) => {
        const diameter = Math.sqrt(width * width + height * height) * 2;
        const radius = diameter / 2;
        setCircleTransition({
          left: switchX + switchWidth / 2 - containerX - radius,
          top: switchY + switchHeight / 2 - containerY - radius,
          diameter,
          color: '#111016',
        });
        circleProgress.setValue(next ? 0 : 1);
        if (!next) setDark(false);
        Animated.timing(circleProgress, {
          toValue: next ? 1 : 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && next) setDark(true);
          setCircleTransition(null);
        });
      });
    });
  };
  const palette = dark
    ? { background: '#111016', surface: '#1D1A22', text: '#F8F6FB', muted: '#ADA7B4', border: '#3B3541', accent: '#9275F5' }
    : { background: '#FFFFFF', surface: '#FFFFFF', text: '#0D0D12', muted: '#898D8F', border: '#DFE7EB', accent: '#32A6D8' };
  const informationTitle = (page) => getInformation(i18n.resolvedLanguage || i18n.language, page).title;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await clearPushTokenOnServer().catch(() => {});
          dispatch(logout());
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      copy("Delete Account"),
      copy("This permanently deletes your account and all associated data — profile, pets, bookings, messages, and reviews. This cannot be undone."),
      [
        { text: copy("Cancel"), style: 'cancel' },
        {
          text: copy('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/profile');
              await clearPushTokenOnServer().catch(() => {});
              dispatch(logout());
            } catch (e) {
              Alert.alert(copy("Error"), e?.response?.data?.message || copy('Failed to delete account. Please try again.'));
            }
          },
        },
      ],
    );
  };

  const handleMenuPress = (item) => {
    if (item.action) {
      item.action();
    } else if (item.screen) {
      navigation.navigate(item.screen, item.params);
    }
  };

  const generalSettings = [
    { title: t('settings.accountSetting'), screen: 'EditProfileDetails' },
    { title: t('settings.notification'), screen: 'Notifications' },
    { title: t('settings.language'), screen: 'Language', params: { fromSettings: true } },
    { title: copy('Payment currency'), screen: 'PaymentCountry' },
    { title: 'Blocked Users', screen: 'BlockedUsers' },
    { title: informationTitle('privacyChoices'), screen: 'Information', params: { page: 'privacyChoices' } },
    { title: t('settings.logout'), action: handleLogout },
  ];

  const aboutSettings = [
    { title: informationTitle('privacyPolicy'), screen: 'Information', params: { page: 'privacyPolicy' } },
    { title: informationTitle('terms'), screen: 'Information', params: { page: 'terms' } },
    { title: informationTitle('about'), screen: 'Information', params: { page: 'about' } },
    { title: 'Delete Account', action: handleDeleteAccount, danger: true },
  ];

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={() => handleMenuPress(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.menuText, item.danger && { color: '#F56754' }]}>{copy(item.title)}</Text>
      <Icon name="chevron-down" size={20} color={item.danger ? "#F56754" : "#32A6D8"} style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper noBottomTabs>
      <View ref={containerRef} collapsable={false} style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>{t('settings.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* General Section */}
          <View style={styles.section}>
            <View style={[styles.appearancePanel, dark && styles.appearancePanelDark]}>
              <Text style={[styles.sectionTitle, { color: palette.muted }]}>{t('settings.appearance').toUpperCase()}</Text>
            <View style={[styles.appearanceRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.appearanceLabel}>
                <Icon name="moon-outline" size={23} color={palette.accent} />
                <Text style={[styles.appearanceTitle, { color: palette.text }]}>{copy('Dark mode')}</Text>
              </View>
              <View ref={switchRef} collapsable={false} style={styles.darkModeSwitch}>
                <Switch
                  accessibilityRole="switch"
                  accessibilityLabel={copy('Dark mode')}
                  value={dark}
                  onValueChange={toggleDarkMode}
                  disabled={Boolean(circleTransition)}
                  trackColor={{ false: '#CBD1D5', true: '#9275F5' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            </View>
            <View style={styles.menuContainer}>
              {generalSettings.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.menuItem, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => handleMenuPress(item)} activeOpacity={0.7}>
                  <Text style={[styles.menuText, { color: item.danger ? '#F56754' : palette.muted }]}>{copy(item.title)}</Text>
                  <Icon name="chevron-down" size={20} color={item.danger ? '#F56754' : palette.accent} style={styles.chevron} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.muted }]}>{t('settings.about')}</Text>
            <View style={styles.menuContainer}>
              {aboutSettings.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.menuItem, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => handleMenuPress(item)} activeOpacity={0.7}>
                  <Text style={[styles.menuText, { color: item.danger ? '#F56754' : palette.muted }]}>{copy(item.title)}</Text>
                  <Icon name="chevron-down" size={20} color={item.danger ? '#F56754' : palette.accent} style={styles.chevron} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
        {circleTransition && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', zIndex: 20, width: circleTransition.diameter,
            height: circleTransition.diameter, left: circleTransition.left, top: circleTransition.top,
            borderRadius: circleTransition.diameter / 2, backgroundColor: circleTransition.color, elevation: 100,
            transform: [{ scale: circleProgress }],
          }} />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
    backgroundColor: '#FFFFFF',
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
  headerTitle: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#0D0D12',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 18.6,
    marginBottom: 16,
  },
  menuContainer: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 1,
    borderRadius: 12,
    borderWidth: 1,
  },
  darkModeSwitch: { alignSelf: 'center', justifyContent: 'center' },
  appearancePanel: { marginBottom: 16 },
  appearancePanelDark: { padding: 20, borderRadius: 30, backgroundColor: '#17141B', borderWidth: 1, borderColor: '#39343F' },
  appearanceRow: { minHeight: 76, borderWidth: 1, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appearanceLabel: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  appearanceTitle: { fontSize: 14, fontFamily: 'Avenir LT Std', fontWeight: '700' },
  appearanceHint: { fontSize: 11, marginTop: 3 },
  menuText: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  chevron: {
    transform: [{ rotate: '-90deg' }],
  },
});

