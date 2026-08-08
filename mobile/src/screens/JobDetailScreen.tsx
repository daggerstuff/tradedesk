import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../api/client';

interface Photo {
  id: string;
  job_id: string;
  caption: string | null;
  created_at: string;
  photo_preview: string;
  photo_size: number;
}

export function JobDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/jobs/${id}`);
      setJob(data.job || data);
      const photoData = await apiFetch(`/jobs/${id}/photos`);
      setPhotos(photoData.photos || []);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]?.base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]?.base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const uploadPhoto = async (base64: string) => {
    setUploading(true);
    try {
      await apiFetch(`/jobs/${id}/photos`, {
        method: 'POST',
        body: JSON.stringify({ photoData: `data:image/jpeg;base64,${base64}`, caption: '' }),
      });
      load();
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const viewPhoto = async (photoId: string) => {
    try {
      const data = await apiFetch(`/jobs/${id}/photos/${photoId}`);
      if (data.photo?.photo_data) {
        setFullPhoto(data.photo.photo_data);
      }
    } catch { }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiFetch(`/jobs/${id}/photos/${photoId}`, { method: 'DELETE' });
            setPhotos(photos.filter(p => p.id !== photoId));
          } catch { }
        }
      },
    ]);
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!job) return <View style={styles.loading}><Text style={{ color: '#94a3b8' }}>Job not found</Text></View>;

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity style={styles.photoThumb} onPress={() => viewPhoto(item.id)} onLongPress={() => deletePhoto(item.id)}>
      <Image source={{ uri: item.photo_preview }} style={styles.photoImage} resizeMode="cover" />
      <Text style={styles.photoDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

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

      {/* Photos section */}
      <View style={styles.photosSection}>
        <View style={styles.photosHeader}>
          <Text style={styles.photosTitle}>Job Site Photos</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} disabled={uploading}>
              <Text style={styles.photoBtnText}>📷 Take</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} disabled={uploading}>
              <Text style={styles.photoBtnText}>📁 Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {uploading && (
          <View style={styles.uploading}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {photos.length > 0 ? (
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoList}
          />
        ) : (
          <Text style={styles.noPhotos}>No photos yet. Tap "Take" to capture a job site photo.</Text>
        )}
      </View>
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
  photosSection: { paddingHorizontal: 20, marginTop: 24, paddingBottom: 40 },
  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  photosTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  photoButtons: { flexDirection: 'row', gap: 8 },
  photoBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  photoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  uploading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  uploadingText: { fontSize: 14, color: '#64748b' },
  photoList: { marginTop: 8 },
  photoThumb: { marginRight: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  photoImage: { width: 140, height: 140, borderRadius: 12 },
  photoDate: { fontSize: 11, color: '#64748b', textAlign: 'center', paddingBottom: 4 },
  noPhotos: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 16, marginBottom: 16 },
});
