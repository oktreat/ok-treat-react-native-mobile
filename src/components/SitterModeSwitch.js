import { View, Text, Switch, StyleSheet } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { copy } from '../i18n/copy';

export default function SitterModeSwitch({ sitterMode, onChange, disabled = false }) {
  const accent = sitterMode ? '#56AA9A' : '#1689C3';
  const label = copy(sitterMode ? 'Sitter mode' : 'Owner mode');
  const { dark } = useAppearance();
  return <View style={[styles.row, dark && { backgroundColor: '#1D1A22', borderColor: '#3B3541' }]}>
    <Text style={[styles.label, { color: accent }]}>{label}</Text>
    <Switch accessibilityLabel={label} value={sitterMode} onValueChange={onChange} disabled={disabled} trackColor={{ false: '#1689C3', true: '#56AA9A' }} thumbColor="#FFFFFF" ios_backgroundColor="#1689C3" />
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: '#DFE7EB', backgroundColor: '#FFF', marginBottom: 18 }, label: { fontSize: 16, fontWeight: '700' } });
