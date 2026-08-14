import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { MoreStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;

const menuItems: { name: keyof MoreStackParamList; label: string; icon: string }[] = [
  { name: 'Expenses', label: 'Expenses', icon: 'wallet' },
  { name: 'Customers', label: 'Customers', icon: 'people' },
  { name: 'Reports', label: 'Reports', icon: 'bar-chart' },
  { name: 'Compliance', label: 'Compliance', icon: 'shield-checkmark' },
  { name: 'Referral', label: 'Referrals', icon: 'gift' },
  { name: 'Settings', label: 'Settings', icon: 'settings' },
];

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>More</Text>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.name} style={styles.card} onPress={() => nav.navigate(item.name as any)}>
            <Ionicons name={item.icon as any} size={28} color="#4f46e5" />
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '47%', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  cardLabel: { marginTop: 8, fontSize: 16, fontWeight: '600', color: '#0f172a' },
});
