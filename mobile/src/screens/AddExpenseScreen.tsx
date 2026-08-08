import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../api/client';

const CATEGORIES = ['materials', 'labor', 'travel', 'equipment', 'software', 'rent', 'utilities', 'marketing', 'other'];

export function AddExpenseScreen() {
  const nav = useNavigation<any>();
  const [category, setCategory] = useState('materials');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!vendor || !amount) { Alert.alert('Error', 'Vendor and amount are required'); return; }
    setLoading(true);
    try {
      await apiFetch('/expenses', { method: 'POST', body: JSON.stringify({ category, vendor, amount: parseFloat(amount), date, description }) });
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.catPill, category === cat && styles.catActive]}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Vendor</Text>
        <TextInput style={styles.input} value={vendor} onChangeText={setVendor} placeholder="Vendor name" placeholderTextColor="#94a3b8" />
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Notes..." placeholderTextColor="#94a3b8" />
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b' },
  catActive: { backgroundColor: '#4f46e5' },
  catText: { color: '#94a3b8', fontSize: 13, textTransform: 'capitalize' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
