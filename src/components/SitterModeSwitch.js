import { View, Text, Switch, StyleSheet } from 'react-native';

export default function SitterModeSwitch({ sitterMode, onChange, disabled = false }) {
  return <View style={styles.row}>
    <Text style={styles.label}>Sitter mode</Text>
    <Switch accessibilityLabel="Sitter mode" value={sitterMode} onValueChange={onChange} disabled={disabled} trackColor={{ false: '#CBD1D5', true: '#126F82' }} thumbColor="#FFFFFF" ios_backgroundColor="#CBD1D5" />
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: '#DFE7EB', backgroundColor: '#FFF', marginBottom: 18 }, label: { color: '#142D38', fontSize: 16, fontWeight: '700' } });
