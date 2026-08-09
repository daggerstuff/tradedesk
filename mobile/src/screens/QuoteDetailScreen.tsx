import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export function QuoteDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/quotes/${id}`);
      setQuote(data.quote || data);
      setItems(data.items || []);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const convertToInvoice = async () => {
    Alert.alert('Convert to Invoice', 'Create an invoice from this quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Convert', onPress: async () => {
          try {
            await apiFetch(`/quotes/${id}/convert`, { method: 'POST' });
            Alert.alert('Success', 'Invoice created from quote', [{ text: 'OK' }]);
            load();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!quote) return <View style={styles.loading}><Text style={{ color: '#94a3b8' }}>Quote not found</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.header}>
        <Text style={styles.number}>{quote.quote_number}</Text>
        <View style={[styles.badge, (styles as Record<string, object>)[`badge_${quote.status}`] || styles.badge_draft]}>
          <Text style={styles.badgeText}>{quote.status}</Text>
        </View>
      </View>
      <Text style={styles.customer}>{quote.customer_name}</Text>
      <Text style={styles.date}>Valid until {new Date(quote.valid_until).toLocaleDateString()}</Text>

      <Text style={styles.sectionTitle}>Line Items</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <Text style={styles.itemQty}>{item.quantity} × ${Number(item.rate).toFixed(2)}</Text>
          </View>
          <Text style={styles.itemTotal}>${(Number(item.quantity) * Number(item.rate)).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${Number(quote.total).toFixed(2)}</Text>
      </View>

      {quote.status !== 'invoiced' && quote.status !== 'rejected' && (
        <TouchableOpacity style={styles.convertBtn} onPress={convertToInvoice}>
          <Text style={styles.convertText}>Convert to Invoice</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  number: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  customer: { fontSize: 16, color: '#64748b', paddingHorizontal: 20, marginTop: 4 },
  date: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 20, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, borderColor: '#e2e8f0' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  itemDesc: { fontSize: 15, color: '#0f172a' },
  itemQty: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  convertBtn: { margin: 20, backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  convertText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_draft: { backgroundColor: '#94a3b8' },
  badge_sent: { backgroundColor: '#3b82f6' },
  badge_accepted: { backgroundColor: '#22c55e' },
  badge_rejected: { backgroundColor: '#ef4444' },
  badge_invoiced: { backgroundColor: '#8b5cf6' },
});
