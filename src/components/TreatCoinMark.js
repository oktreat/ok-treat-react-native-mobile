import { View, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

// Compact, static paw coin for balance labels; no letter or currency symbol.
export default function TreatCoinMark({ size = 22 }) {
  return <View accessible={false} style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}><Icon name="paw" size={size * 0.62} color="#926511" /></View>;
}
const styles = StyleSheet.create({ coin: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6D46C', borderWidth: 1.5, borderColor: '#B98922' } });
