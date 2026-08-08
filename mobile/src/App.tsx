import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthStack } from './navigation/AuthStack';
import { AppStack } from './navigation/AppStack';
import { apiFetch, setToken, registerForPushNotifications } from './api/client';

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const notificationListener = useRef<unknown>(null);
  const responseListener = useRef<unknown>(null);

  useEffect(() => {
    (async () => {
      try {
        await apiFetch('/auth/me');
        setIsAuthed(true);
        await registerForPushNotifications();
      } catch {
        setIsAuthed(false);
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthed) return;

    let isMounted = true;

    (async () => {
      if (isMounted) {
        const Notifications = await import('expo-notifications');
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: unknown) => {
          console.log('[push] received:', notification);
        });
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: unknown) => {
          console.log('[push] tapped:', response);
        });
      }
    })();

    return () => {
      isMounted = false;
      (async () => {
        const Notifications = await import('expo-notifications');
        if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
        if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
      })();
    };
  }, [isAuthed]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {isAuthed ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
