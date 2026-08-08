import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export function NewQuoteScreen() {
  const nav = useNavigation<any>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [items, setItems] = useState([{ description: '', quantity: '1', rate: '0' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/customers').then(d => setCustomers(d.customers || [])).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { description: '', quantity: '1', rate: '0' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) => {
    const next = [...items];
    (next[i] as any)[field] = val;
    setItems(next);
  };

  const total = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0), 0);

  const handleSave = async () => {
    if (!customerId) { Alert.alert('Error', 'Select a customer'); return; }
    setLoading(true);
    try {
      await apiFetch('/quotes', { method: 'POST', body: JSON.stringify({ customerId, validUntil, items: items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity), rate: parseFloat(i.rate) })) }) });
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={styles.label}>Customer</Text>
        <View style={styles.pickerWrap}>
          {customers.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setCustomerId(c.id)} style={[styles.pickerItem, customerId === c.id && styles.pickerActive]}>
              <Text style={[styles.pickerText, customerId === c.id && styles.pickerTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Valid Until</Text>
        <TextInput style={styles.input} value={validUntil} onChangeText={setValidUntil} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />

        <Text style={styles.label}>Line Items</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.itemCard}>
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#94a3b8" value={item.description} onChangeText={v => updateItem(i, 'description', v)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Qty" placeholderTextColor="#94a3b8" value={item.quantity} onChangeText={v => updateItem(i, 'quantity', v)} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Rate" placeholderTextColor="#94a3b8" value={item.rate} onChangeText={v => updateItem(i, 'rate', v)} keyboardType="decimal-pad" />
            </View>
            {items.length > 1 && <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>}
          </View>
        ))}
        <TouchableOpacity onPress={addItem} style={styles.addBtn}><Text style={styles.addBtnText}>+ Add Line Item</Text></TouchableOpacity>

        <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${total.toFixed(2)}</Text></View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Create Quote'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  pickerWrap: { gap: 8 },
  pickerItem: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14 },
  pickerActive: { backgroundColor: '#4f46e5' },
  pickerText: { color: '#94a3b8', fontSize: 16 },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  itemCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, gap: 8 },
  removeBtn: { alignSelf: 'flex-end', padding: 4 },
  removeText: { color: '#ef4444', fontSize: 13 },
  addBtn: { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#4f46e5', borderRadius: 12, borderStyle: 'dashed' },
  addBtnText: { color: '#818cf8', fontSize: 14, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#fff' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  saveBtn: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
