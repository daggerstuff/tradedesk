import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setToken, apiFetch, registerForPushNotifications, unregisterPushNotifications } from '../api/client';

export function SettingsScreen() {
  const nav = useNavigation<any>();
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    apiFetch('/push/register', { method: 'PATCH', body: JSON.stringify({}) }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await unregisterPushNotifications();
          await setToken(null);
          nav.getParent()?.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const togglePush = async (value: boolean) => {
    setPushEnabled(value);
    try {
      await apiFetch('/push/register', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: value }),
      });
      if (value) {
        await registerForPushNotifications();
      } else {
        await unregisterPushNotifications();
      }
    } catch {
      setPushEnabled(!value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.hint}>Get notified about payments, invoices, and compliance alerts.</Text>
      </View>
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
  row: { paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 16, color: '#0f172a' },
  logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '500' },
  about: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
});
