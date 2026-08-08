import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { MoreStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Customers'>;

interface Customer { id: string; name: string; email: string; phone: string | null; total_invoiced: number; }

export function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation<Nav>();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/customers');
      setCustomers(data.customers || []);
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.item} onPress={() => { /* could navigate to customer detail */ }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
      </View>
      {item.total_invoiced > 0 && <Text style={styles.total}>${Number(item.total_invoiced).toFixed(2)}</Text>}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={customers}
      keyExtractor={(c) => c.id}
      renderItem={renderItem}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f8fafc' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={styles.empty}>No customers yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  email: { fontSize: 13, color: '#64748b', marginTop: 2 },
  phone: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  total: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 60, fontSize: 16 },
});
