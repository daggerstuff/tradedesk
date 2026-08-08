import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export function ReportsScreen() {
  const [data, setData] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, exp] = await Promise.all([apiFetch('/invoices'), apiFetch('/expenses')]);
      const invoices = inv.invoices || [];
      const expenses = exp.expenses || [];
      const revenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total), 0);
      const totalExp = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const outstanding = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.total), 0);
      const draftCount = invoices.filter((i: any) => i.status === 'draft').length;
      const paidCount = invoices.filter((i: any) => i.status === 'paid').length;
      setData({ revenue, totalExp, outstanding, draftCount, paidCount, net: revenue - totalExp });
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Revenue</Text>
          <Text style={styles.cardValue}>${data.revenue?.toLocaleString() || 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={[styles.cardValue, { color: '#ef4444' }]}>${data.totalExp?.toLocaleString() || 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Net</Text>
          <Text style={[styles.cardValue, { color: (data.net || 0) >= 0 ? '#22c55e' : '#ef4444' }]}>${(data.net || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Outstanding A/R</Text>
          <Text style={[styles.cardValue, { color: '#f59e0b' }]}>${data.outstanding?.toLocaleString() || 0}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Invoice Status</Text>
      <View style={styles.statusRow}>
        <View style={styles.statusItem}><Text style={styles.statusText}>{data.draftCount || 0}</Text><Text style={styles.statusLabel}>Draft</Text></View>
        <View style={styles.statusItem}><Text style={styles.statusText}>{data.paidCount || 0}</Text><Text style={styles.statusLabel}>Paid</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', borderWidth: 1, borderColor: '#e2e8f0' },
  cardLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', paddingTop: 24, paddingBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 20 },
  statusItem: { alignItems: 'center' },
  statusText: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  statusLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
