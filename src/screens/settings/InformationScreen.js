import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from '../../components/ScreenWrapper';
import { BackArrowIcon } from '../../assets';
import { getInformation } from './informationContent';
import existingTerms from './existingTerms';

export default function InformationScreen({ navigation, route }) {
  const { i18n } = useTranslation();
  const page = route?.params?.page || 'privacyPolicy';
  const content = getInformation(i18n.resolvedLanguage || i18n.language, page);
  const [showTerms, setShowTerms] = useState(false);
  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={content.back} onPress={() => navigation.goBack()} style={styles.back}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <Text accessibilityRole="header" style={styles.headerTitle}>{content.title}</Text>
        </View>
        <ScrollView key={content.key} contentContainerStyle={styles.scroll}>
          <View style={styles.introCard}>
            <Text style={styles.brand}>OkTreat</Text>
            <Text accessibilityRole="header" style={styles.title}>{content.title}</Text>
            <Text style={styles.intro}>{content.intro}</Text>
            <Text style={styles.date}>{content.updated}</Text>
          </View>
          {content.sections.map(([title, body], index) => (
            <View key={index} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
              <Text selectable style={styles.body}>{body}</Text>
            </View>
          ))}
          {content.key === 'terms' && <>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showTerms }} onPress={() => setShowTerms(value => !value)} style={styles.secondary}>
              <Text style={styles.secondaryText}>{showTerms ? content.closeTerms : content.fullTerms}</Text>
            </TouchableOpacity>
            {showTerms && <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{existingTerms.title} · {existingTerms.updated}</Text>
              {existingTerms.body.map((paragraph, index) => <Text selectable key={index} style={styles.termParagraph}>{paragraph}</Text>)}
            </View>}
          </>}
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('HelpSupport')} style={styles.support}>
            <Text style={styles.supportText}>{content.support}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0ECF1' },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#123846' },
  scroll: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' },
  introCard: { borderRadius: 20, backgroundColor: '#EDF7FB', padding: 22, marginBottom: 24 },
  brand: { color: '#087FAE', fontWeight: '700', fontSize: 16, marginBottom: 10 },
  title: { color: '#123846', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  intro: { color: '#294C59', fontSize: 16, lineHeight: 25 },
  date: { color: '#486773', fontSize: 13, lineHeight: 20, marginTop: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#123846', fontSize: 19, fontWeight: '700', marginBottom: 8 },
  body: { color: '#294C59', fontSize: 16, lineHeight: 26 },
  termParagraph: { color: '#294C59', fontSize: 16, lineHeight: 26, marginBottom: 16 },
  secondary: { minHeight: 48, borderWidth: 1, borderColor: '#77B7D0', borderRadius: 12, padding: 16, marginBottom: 24 },
  secondaryText: { color: '#075A7B', fontSize: 16, fontWeight: '700' },
  support: { minHeight: 48, borderRadius: 12, backgroundColor: '#087FAE', padding: 16, alignItems: 'center' },
  supportText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
