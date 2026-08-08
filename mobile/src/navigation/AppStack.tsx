import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { QuotesScreen } from '../screens/QuotesScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { MoreStack } from './MoreStack';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#6366f1',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
      />
      <Tab.Screen name="Invoices" component={InvoicesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }}
      />
      <Tab.Screen name="Quotes" component={QuotesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" size={size} color={color} /> }}
      />
      <Tab.Screen name="Jobs" component={JobsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} /> }}
      />
      <Tab.Screen name="More" component={MoreStack}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={color} />, headerShown: false }}
      />
    </Tab.Navigator>
  );
}
