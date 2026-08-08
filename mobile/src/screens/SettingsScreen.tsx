import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setToken } from '../api/client';

export function SettingsScreen() {
  const nav = useNavigation<any>();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await setToken(null);
          // The app should re-check auth on next focus — for now, reset the stack
          nav.getParent()?.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.about}>TradeDesk v1.0.0</Text>
        <Text style={styles.about}>Run your trade business from your phone.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  row: { paddingVertical: 8 },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '500' },
  about: { fontSize: 14, color: '#64748b', marginBottom: 4 },
});
