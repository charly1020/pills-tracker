import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { reconcileAlarms } from '../alarm/service';

import { AlarmOverlay } from '../components/AlarmOverlay';
import { scaled } from '../domain/textSize';
import { TextSizeProvider, useTextSize } from '../settings/textSize';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <TextSizeProvider>
      <Shell />
    </TextSizeProvider>
  );
}

function Shell() {
  const { scale } = useTextSize();
  useEffect(() => {
    reconcileAlarms().catch((e) => console.warn('reconcileAlarms failed', e));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleStyle: { fontSize: scaled(24, scale), fontWeight: '800' },
          headerStyle: { backgroundColor: colors.bg },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Mis pastillas' }} />
        <Stack.Screen name="pill/[id]" options={{ title: 'Pastilla' }} />
        <Stack.Screen name="herramientas" options={{ title: 'Herramientas' }} />
      </Stack>
      <AlarmOverlay />
    </View>
  );
}
