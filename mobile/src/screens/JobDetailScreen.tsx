import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export function JobDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/jobs/${id}`);
      setJob(data.job || data);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!job) return <View style={styles.loading}><Text style={{ color: '#94a3b8' }}>Job not found</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.badge, styles[`badge_${job.status}`] || styles.badge_scheduled]}>
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.customer}>{job.customer_name}</Text>
      {job.scheduled_date && <Text style={styles.detail}>Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}</Text>}
      {job.address && <Text style={styles.detail}>Address: {job.address}</Text>}
      {job.description && (
        <View style={styles.descCard}>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>
      )}
      {job.assigned_to && <Text style={styles.detail}>Assigned to: {job.assigned_to}</Text>}
      {job.estimated_value != null && <Text style={styles.detail}>Estimated value: ${Number(job.estimated_value).toFixed(2)}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', flex: 1 },
  customer: { fontSize: 16, color: '#64748b', paddingHorizontal: 20, marginTop: 4 },
  detail: { fontSize: 14, color: '#475569', paddingHorizontal: 20, marginTop: 8 },
  descCard: { margin: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  descLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  descText: { fontSize: 15, color: '#0f172a', lineHeight: 22 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  badge_scheduled: { backgroundColor: '#3b82f6' },
  badge_in_progress: { backgroundColor: '#f59e0b' },
  badge_completed: { backgroundColor: '#22c55e' },
  badge_cancelled: { backgroundColor: '#94a3b8' },
});
