import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setToken, apiFetch, registerForPushNotifications, unregisterPushNotifications, sendTestPush } from '../api/client';

export function SettingsScreen() {
  const nav = useNavigation<any>();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    apiFetch('/push/register')
      .then(d => { setPushEnabled(d.enabled); setHasToken(d.hasToken); })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    const prev = pushEnabled;
    setPushEnabled(value);
    try {
      await apiFetch('/push/register', {
        method: 'PUT',
        body: JSON.stringify({ enabled: value }),
      });
      if (value) {
        await registerForPushNotifications();
        setHasToken(true);
      } else {
        await unregisterPushNotifications();
        setHasToken(false);
      }
    } catch {
      setPushEnabled(prev);
    }
  };

  const handleTestPush = async () => {
    setTestSending(true);
    try {
      await sendTestPush();
      Alert.alert('Sent!', 'Check your notifications.');
    } catch {
      Alert.alert('Failed', 'Could not send test notification.');
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

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
        <Text style={styles.hint}>
          {pushEnabled && hasToken
            ? 'You\'re receiving notifications for payments, jobs, and compliance.'
            : pushEnabled
              ? 'Enable device permissions to receive notifications.'
              : 'Get notified about payments, invoices, and compliance alerts.'}
        </Text>
        {pushEnabled && (
          <TouchableOpacity style={styles.testBtn} onPress={handleTestPush} disabled={testSending}>
            <Text style={styles.testBtnText}>
              {testSending ? 'Sending...' : 'Send Test Notification'}
            </Text>
          </TouchableOpacity>
        )}
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
  testBtn: { marginTop: 12, backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  testBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
