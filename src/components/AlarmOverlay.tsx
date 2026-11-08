import notifee, { EventType, type Notification } from '@notifee/react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TEST_ID } from '../alarm/alarm';
import { handleAlarmEvent } from '../alarm/events';
import { done, isRealAlarm, snooze } from '../alarm/service';
import { getPill } from '../db/repository';
import { formatDose } from '../domain/format';
import type { Pill } from '../domain/types';
import { colors, text } from '../theme';
import { BigButton } from './BigButton';

/** Full-screen alarm UI, shown on top of everything while an alarm notification is ringing. */
export function AlarmOverlay() {
  const insets = useSafeAreaInsets();
  const [alarm, setAlarm] = useState<Notification | null>(null);
  const [pills, setPills] = useState<Pill[]>([]);

  const check = useCallback(async () => {
    const shown = await notifee.getDisplayedNotifications();
    const n = shown.find((d) => d.id === TEST_ID || isRealAlarm(d.id))?.notification ?? null;
    setAlarm(n);
    const ids = String(n?.data?.pillIds ?? '').split(',').filter(Boolean).map(Number);
    const found = await Promise.all(ids.map(getPill));
    setPills(found.filter((p): p is Pill => p !== null));
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    const unsub = notifee.onForegroundEvent(async (e) => {
      await handleAlarmEvent(e);
      if (e.type === EventType.DELIVERED || e.type === EventType.ACTION_PRESS) check();
    });
    return () => {
      sub.remove();
      unsub();
    };
  }, [check]);

  if (!alarm) return null;
  const isTest = alarm.id === TEST_ID;
  const act = async (action: typeof done) => {
    if (isTest) await notifee.cancelDisplayedNotification(TEST_ID);
    else await action(alarm);
    check();
  };

  return (
    <View style={[styles.overlay, { paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[text.title, styles.center]}>Hora de tu pastilla</Text>
        {isTest && <Text style={[text.heading, styles.center]}>{alarm.body}</Text>}
        {pills.map((p) => (
          <View key={p.id} style={styles.pill}>
            {p.photoUri ? <Image source={{ uri: p.photoUri }} style={styles.photo} /> : null}
            <Text style={[text.heading, styles.center]}>{p.name}</Text>
            <Text style={[text.body, styles.center]}>Dosis: {formatDose(p)}</Text>
            {p.notes ? <Text style={[text.small, styles.center]}>{p.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>
      <View style={[styles.buttons, { paddingBottom: insets.bottom + 24 }]}>
        <BigButton title="Hecho" color={colors.success} onPress={() => act(done)} />
        <BigButton title="Posponer 5 min" color={colors.warning} onPress={() => act(snooze)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  list: { padding: 24, gap: 16 },
  buttons: { padding: 24, gap: 12 },
  center: { textAlign: 'center' },
  pill: { gap: 6, padding: 12, borderRadius: 16, backgroundColor: colors.card },
  photo: { width: '100%', height: 180, borderRadius: 12 },
});
