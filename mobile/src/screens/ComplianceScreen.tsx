import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';

interface Doc { id: string; name: string; type: string; status: string; expiry_date: string | null; }

export function ComplianceScreen() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/compliance');
      setDocs(data.documents || []);
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: Doc }) => {
    const daysLeft = item.expiry_date ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000) : null;
    return (
      <View style={styles.item}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.type}>{item.type}</Text>
          {item.expiry_date && (
            <Text style={[styles.expiry, daysLeft !== null && daysLeft < 30 && styles.expiryWarn]}>
              Expires {new Date(item.expiry_date).toLocaleDateString()} ({daysLeft}d)
            </Text>
          )}
        </View>
        <View style={[styles.badge, styles[`badge_${item.status}`] || styles.badge_active]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={docs}
      keyExtractor={(d) => d.id}
      renderItem={renderItem}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f8fafc' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={styles.empty}>No compliance documents</Text>}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  type: { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  expiry: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  expiryWarn: { color: '#ef4444', fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_active: { backgroundColor: '#22c55e' },
  badge_expiring: { backgroundColor: '#f59e0b' },
  badge_expired: { backgroundColor: '#ef4444' },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 60, fontSize: 16 },
});
