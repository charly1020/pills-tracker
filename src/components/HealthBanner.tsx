import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';

import { checkHealth, fixProblem } from '../alarm/health';
import { PROBLEM_TEXT, problems, type Problem } from '../alarm/problems';

/** Red warning shown whenever the alarm could not ring reliably. Re-checks every time the app comes to the front. */
export function HealthBanner() {
  const [found, setFound] = useState<Problem[]>([]);
  const refresh = useCallback(() => checkHealth().then((h) => setFound(problems(h))).catch(() => {}), []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  if (found.length === 0) return null;
  return (
    <View style={styles.box}>
      {found.map((p) => (
        <View key={p} style={styles.row}>
          <Text style={styles.text}>⚠ {PROBLEM_TEXT[p]}</Text>
          <Pressable style={styles.button} onPress={() => fixProblem(p).then(refresh)}>
            <Text style={styles.buttonText}>Activar</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, padding: 12, borderRadius: 8, backgroundColor: '#fee4e2', borderWidth: 1, borderColor: '#b42318' },
  row: { gap: 8 },
  text: { fontSize: 18, color: '#7a271a', fontWeight: '600' },
  button: { paddingVertical: 14, borderRadius: 8, backgroundColor: '#b42318', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
