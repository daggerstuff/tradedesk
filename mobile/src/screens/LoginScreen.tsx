import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthParamList } from '../navigation/AuthStack';
import { apiFetch, setToken } from '../api/client';

type NavProp = NativeStackNavigationProp<AuthParamList, 'Login'>;

export function LoginScreen() {
  const nav = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setToken(data.token);
      // Force app reload by checking auth state
      (nav as any).getParent()?.navigate('App' as any);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>TradeDesk</Text>
        <Text style={styles.tagline}>Run your trade business</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b"
          value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Signup')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  form: { gap: 12 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', padding: 12 },
  linkText: { color: '#818cf8', fontSize: 14 },
});
