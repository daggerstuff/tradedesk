import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';

type Nav = NativeStackNavigationProp<BottomTabParamList, 'Invoices'>;

interface Invoice { id: string; invoice_number: string; customer_name: string; total: number; status: string; due_date: string; }

export function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation<any>();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/invoices');
      setInvoices(data.invoices || []);
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity style={styles.item} onPress={() => nav.navigate('More', { screen: 'InvoiceDetail', params: { id: item.id } })}>
      <View style={{ flex: 1 }}>
        <Text style={styles.number}>{item.invoice_number}</Text>
        <Text style={styles.customer}>{item.customer_name}</Text>
        <Text style={styles.due}>Due {new Date(item.due_date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.amount}>${Number(item.total).toFixed(2)}</Text>
      <View style={[styles.badge, (styles as Record<string, object>)[`badge_${item.status}`] || styles.badge_draft]}>
        <Text style={styles.badgeText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={invoices}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={styles.empty}>No invoices yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, backgroundColor: '#f8fafc' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  number: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  customer: { fontSize: 14, color: '#64748b', marginTop: 2 },
  due: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_draft: { backgroundColor: '#94a3b8' },
  badge_sent: { backgroundColor: '#3b82f6' },
  badge_paid: { backgroundColor: '#22c55e' },
  badge_overdue: { backgroundColor: '#ef4444' },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 60, fontSize: 16 },
});
