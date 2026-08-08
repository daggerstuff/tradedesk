import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiFetch } from '../api/client';

type Nav = NativeStackNavigationProp<BottomTabParamList, 'Jobs'>;

interface Job { id: string; title: string; customer_name: string; status: string; scheduled_date: string; }

export function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation<any>();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/jobs');
      setJobs(data.jobs || []);
    } catch { } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.item} onPress={() => nav.navigate('More', { screen: 'JobDetail', params: { id: item.id } })}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.customer}>{item.customer_name}</Text>
        <Text style={styles.date}>{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'Unscheduled'}</Text>
      </View>
      <View style={[styles.badge, styles[`badge_${item.status}`] || styles.badge_scheduled]}>
        <Text style={styles.badgeText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={jobs}
      keyExtractor={(j) => j.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={styles.empty}>No jobs yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, backgroundColor: '#f8fafc' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  customer: { fontSize: 14, color: '#64748b', marginTop: 2 },
  date: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_scheduled: { backgroundColor: '#3b82f6' },
  badge_in_progress: { backgroundColor: '#f59e0b' },
  badge_completed: { backgroundColor: '#22c55e' },
  badge_cancelled: { backgroundColor: '#94a3b8' },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 60, fontSize: 16 },
});
