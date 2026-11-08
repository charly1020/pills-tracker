import { Link, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';

import { BigButton } from '../components/BigButton';
import { HealthBanner } from '../components/HealthBanner';
import { PillThumb } from '../components/PillThumb';
import { listPills } from '../db/repository';
import { formatClock, formatCountdown, formatDose, formatEvery, formatNextAt } from '../domain/format';
import { nextDoseOverall } from '../domain/next';
import { intervalMinutes, nextDose } from '../domain/schedule';
import type { Pill } from '../domain/types';
import { colors, text } from '../theme';

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [pills, setPills] = useState<Pill[]>([]);
  const now = useNow(15_000);
  useFocusEffect(
    useCallback(() => {
      listPills().then(setPills);
    }, [])
  );
  const next = nextDoseOverall(pills, now);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <HealthBanner />

      <View style={styles.next}>
        <Text style={styles.nextLabel}>Próxima pastilla</Text>
        {next ? (
          <>
            <Text style={styles.nextTime}>{formatClock(next.at)}</Text>
            <Text style={styles.nextIn}>{formatCountdown(next.at.getTime() - now.getTime())}</Text>
            {next.pills.map((p) => (
              <Text key={p.id} style={styles.nextName}>
                {p.name}
                {` · Dosis: ${formatDose(p)}`}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.nextName}>Todavía no hay pastillas. Añade la primera.</Text>
        )}
      </View>

      {pills.map((p) => (
        <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/pill/${p.id}`)}>
          <PillThumb uri={p.photoUri} />
          <View style={styles.cardBody}>
            <Text style={text.heading}>{p.name}</Text>
            <Text style={text.small}>{formatEvery(intervalMinutes(p.intervalHours))}</Text>
            <Text style={text.small}>
              {formatNextAt(nextDose({ anchorMinutes: p.anchorMinutes, intervalHours: p.intervalHours }, now))}
            </Text>
          </View>
        </Pressable>
      ))}

      <BigButton title="+ Añadir pastilla" onPress={() => router.push('/pill/new')} color={colors.success} />
      <Link href="/herramientas" style={styles.link}>
        Herramientas y copia de seguridad
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  next: { backgroundColor: colors.primary, borderRadius: 20, padding: 20, gap: 4 },
  nextLabel: { fontSize: 20, color: '#dbeafe', fontWeight: '600' },
  nextTime: { fontSize: 56, fontWeight: '800', color: '#fff' },
  nextIn: { fontSize: 26, fontWeight: '700', color: '#fff' },
  nextName: { fontSize: 24, color: '#fff', marginTop: 4 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  cardBody: { flex: 1, gap: 2 },
  link: { fontSize: 20, color: colors.primary, textAlign: 'center', padding: 12 },
});
