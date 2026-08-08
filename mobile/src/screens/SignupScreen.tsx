import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthParamList } from '../navigation/AuthStack';
import { apiFetch, setToken } from '../api/client';

type NavProp = NativeStackNavigationProp<AuthParamList, 'Signup'>;

export function SignupScreen() {
  const nav = useNavigation<NavProp>();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) { Alert.alert('Error', 'Name, email, and password are required'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, company, email, password }),
      });
      await setToken(data.token);
      (nav as any).getParent()?.navigate('App' as any);
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Company (optional)" placeholderTextColor="#64748b" value={company} onChangeText={setCompany} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('Login')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 32 },
  form: { gap: 12 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', padding: 12 },
  linkText: { color: '#818cf8', fontSize: 14 },
});
