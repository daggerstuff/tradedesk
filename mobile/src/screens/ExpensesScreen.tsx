import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { MoreStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Expenses'>;

interface Expense { id: string; category: string; vendor: string; amount: number; date: string; }

const CATEGORIES = ['all', 'materials', 'labor', 'travel', 'equipment', 'software', 'rent', 'utilities', 'marketing', 'other'];

export function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const nav = useNavigation<Nav>();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/expenses');
      setExpenses(data.expenses || []);
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.vendor}>{item.vendor}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <Text style={styles.amount}>${Number(item.amount).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setFilter(cat)} style={[styles.filterPill, filter === cat && styles.filterActive]}>
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={<Text style={styles.empty}>No expenses</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('AddExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText: { fontSize: 13, color: '#64748b', textTransform: 'capitalize' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  totalText: { paddingHorizontal: 20, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  vendor: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  category: { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  amount: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 60, fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
});
