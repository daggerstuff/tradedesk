import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export function InvoiceDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, pays] = await Promise.all([
        apiFetch(`/invoices/${id}`),
        apiFetch(`/invoices/${id}/payments`),
      ]);
      setInvoice(inv.invoice || inv);
      setItems(inv.items || []);
      setPayments(pays.payments || []);
      setTotalPaid(pays.totalPaid || 0);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  if (!invoice) {
    return <View style={styles.loading}><Text style={{ color: '#94a3b8' }}>Invoice not found</Text></View>;
  }

  const balance = Number(invoice.total) - totalPaid;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.header}>
        <Text style={styles.number}>{invoice.invoice_number}</Text>
        <View style={[styles.badge, (styles as Record<string, object>)[`badge_${invoice.status}`] || styles.badge_draft]}>
          <Text style={styles.badgeText}>{invoice.status}</Text>
        </View>
      </View>
      <Text style={styles.customer}>{invoice.customer_name}</Text>
      <Text style={styles.date}>Due {new Date(invoice.due_date).toLocaleDateString()}</Text>

      <View style={styles.balanceRow}>
        <View style={styles.balanceItem}><Text style={styles.balanceLabel}>Total</Text><Text style={styles.balanceValue}>${Number(invoice.total).toFixed(2)}</Text></View>
        <View style={styles.balanceItem}><Text style={styles.balanceLabel}>Paid</Text><Text style={[styles.balanceValue, { color: '#22c55e' }]}>${totalPaid.toFixed(2)}</Text></View>
        <View style={styles.balanceItem}><Text style={styles.balanceLabel}>Balance</Text><Text style={[styles.balanceValue, { color: balance > 0 ? '#ef4444' : '#22c55e' }]}>${balance.toFixed(2)}</Text></View>
      </View>

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

      <Text style={styles.sectionTitle}>Payments</Text>
      {payments.length === 0 && <Text style={styles.emptyText}>No payments recorded</Text>}
      {payments.map((p) => (
        <View key={p.id} style={styles.paymentRow}>
          <View>
            <Text style={styles.payDate}>{new Date(p.date).toLocaleDateString()}</Text>
            <Text style={styles.payMethod}>{p.method}</Text>
          </View>
          <Text style={styles.payAmount}>${Number(p.amount).toFixed(2)}</Text>
        </View>
      ))}
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
  balanceRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
  balanceItem: { flex: 1 },
  balanceLabel: { fontSize: 12, color: '#94a3b8' },
  balanceValue: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderTopWidth: 1, borderColor: '#e2e8f0' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  itemDesc: { fontSize: 15, color: '#0f172a' },
  itemQty: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  emptyText: { paddingHorizontal: 20, color: '#94a3b8', paddingVertical: 8 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  payDate: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  payMethod: { fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' },
  payAmount: { fontSize: 16, fontWeight: '600', color: '#22c55e' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_draft: { backgroundColor: '#94a3b8' },
  badge_sent: { backgroundColor: '#3b82f6' },
  badge_paid: { backgroundColor: '#22c55e' },
  badge_overdue: { backgroundColor: '#ef4444' },
});
