import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Input from './Input';
import { formatPetAge } from '../utils/petAge';
import { ageInputFromForm } from '../utils/petAgeForm';

export default function PetAgeInput({ formData, setFormData }) {
  const [showPicker, setShowPicker] = useState(false);
  const birthdayMode = formData.ageMode === 'birthday';
  let preview = '';
  try { preview = formatPetAge(ageInputFromForm(formData)); } catch (_) { /* Incomplete input. */ }
  const chosenDate = formData.dateOfBirth ? new Date(`${formData.dateOfBirth}T12:00:00`) : new Date();
  const chooseDate = date => {
    setShowPicker(false);
    const birthday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setFormData(previous => ({ ...previous, dateOfBirth: birthday }));
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Birthday & age</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {[['birthday', 'I know the birthday'], ['estimate', 'Estimate age']].map(([mode, label]) => (
          <TouchableOpacity key={mode} accessibilityRole="radio" accessibilityState={{ checked: formData.ageMode === mode }}
            onPress={() => setFormData(previous => ({ ...previous, ageMode: mode }))}
            style={[styles.option, formData.ageMode === mode && styles.selected]}>
            <Text style={[styles.optionText, formData.ageMode === mode && styles.selectedText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {birthdayMode ? (
        <TouchableOpacity style={styles.date} onPress={() => setShowPicker(true)} accessibilityRole="button" accessibilityLabel={formData.dateOfBirth ? `Change birthday, ${formData.dateOfBirth}` : 'Choose pet birthday'}>
          <Text style={styles.dateText}>{formData.dateOfBirth || 'Choose birthday'}</Text>
          <Text style={styles.calendar}>▾</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.options}>
          <View style={styles.field}><Text style={styles.fieldLabel}>Years</Text>
            <Input type="number" keyboardType="number-pad" placeholder="e.g., 3" value={formData.ageYears}
              onChangeText={ageYears => setFormData(previous => ({ ...previous, ageYears }))} />
          </View>
          <View style={styles.field}><Text style={styles.fieldLabel}>Months (0–11)</Text>
            <Input type="number" keyboardType="number-pad" placeholder="e.g., 6" value={formData.ageMonths}
              onChangeText={ageMonths => setFormData(previous => ({ ...previous, ageMonths }))} />
          </View>
        </View>
      )}
      {preview ? <Text style={styles.preview} accessibilityLiveRegion="polite">{preview}</Text> : null}
      <Text style={styles.help}>{birthdayMode ? 'Age updates automatically from the birthday.' : 'Enter their age today. It will update automatically and be shown as approximate.'}</Text>
      <DateTimePickerModal isVisible={showPicker} mode="date" date={chosenDate} maximumDate={new Date()} onConfirm={chooseDate} onCancel={() => setShowPicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#193441', marginBottom: 10 },
  options: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  option: { flex: 1, minHeight: 48, paddingHorizontal: 10, paddingVertical: 12, borderWidth: 1, borderColor: '#BDD5E1', borderRadius: 12, justifyContent: 'center' },
  selected: { backgroundColor: '#E7F5FC', borderColor: '#2186B0' },
  optionText: { color: '#425E6D', textAlign: 'center', fontSize: 14 },
  selectedText: { color: '#125F80', fontWeight: '600' },
  date: { minHeight: 52, borderWidth: 1, borderColor: '#BDD5E1', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { color: '#193441', fontSize: 16 },
  calendar: { color: '#2186B0', fontSize: 18 },
  field: { flex: 1 },
  fieldLabel: { color: '#425E6D', fontSize: 14, marginBottom: 6 },
  preview: { color: '#125F80', fontSize: 15, fontWeight: '600', marginTop: 8 },
  help: { color: '#425E6D', fontSize: 13, lineHeight: 19, marginTop: 8 },
});
