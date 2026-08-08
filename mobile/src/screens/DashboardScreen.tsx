import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';

type Nav = NativeStackNavigationProp<BottomTabParamList, 'Dashboard'>;

interface Stats { revenue: number; outstanding: number; activeJobs: number; pendingQuotes: number; }
interface RecentInvoice { id: string; invoice_number: string; customer_name: string; total: number; status: string; }

export function DashboardScreen() {
  const [stats, setStats] = useState<Stats>({ revenue: 0, outstanding: 0, activeJobs: 0, pendingQuotes: 0 });
  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation<any>();

  const load = useCallback(async () => {
    try {
      const [inv, jobs, quotes] = await Promise.all([
        apiFetch('/invoices'),
        apiFetch('/jobs'),
        apiFetch('/quotes'),
      ]);
      const invoices = inv.invoices || [];
      const paid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total), 0);
      const outstanding = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.total), 0);
      const active = (jobs.jobs || []).filter((j: any) => j.status === 'scheduled' || j.status === 'in_progress').length;
      const pending = (quotes.quotes || []).filter((q: any) => q.status === 'sent').length;
      setStats({ revenue: paid, outstanding, activeJobs: active, pendingQuotes: pending });
      setRecent(invoices.slice(0, 5));
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.header}>Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>${stats.revenue.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Outstanding</Text>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>${stats.outstanding.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Jobs</Text>
          <Text style={styles.statValue}>{stats.activeJobs}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Quotes</Text>
          <Text style={styles.statValue}>{stats.pendingQuotes}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Invoices</Text>
      {recent.length === 0 && !loading && <Text style={styles.emptyText}>No invoices yet</Text>}
      {recent.map((inv) => (
        <TouchableOpacity key={inv.id} style={styles.listItem} onPress={() => nav.navigate('More', { screen: 'InvoiceDetail', params: { id: inv.id } })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{inv.invoice_number}</Text>
            <Text style={styles.itemSub}>{inv.customer_name}</Text>
          </View>
          <Text style={styles.itemAmount}>${Number(inv.total).toFixed(2)}</Text>
          <View style={[styles.badge, styles[`badge_${inv.status}`] || styles.badge_draft]}>
            <Text style={styles.badgeText}>{inv.status}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { fontSize: 28, fontWeight: '700', color: '#0f172a', padding: 20, paddingBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  emptyText: { color: '#94a3b8', paddingHorizontal: 20, paddingVertical: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  itemSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_draft: { backgroundColor: '#94a3b8' },
  badge_sent: { backgroundColor: '#3b82f6' },
  badge_paid: { backgroundColor: '#22c55e' },
  badge_overdue: { backgroundColor: '#ef4444' },
});
