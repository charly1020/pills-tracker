import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from './AppText';
import { colors } from '../theme';

/** Square pill photo for lists. If the file can't be shown it says so, instead of looking like "no photo". */
export function PillThumb({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!uri) return <View style={[styles.box, styles.none]} />;
  if (failed) {
    return (
      <View style={[styles.box, styles.broken]}>
        <Text style={styles.brokenText}>Foto no disponible</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.box} onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  box: { width: 84, height: 84, borderRadius: 12 },
  none: { backgroundColor: colors.border },
  broken: { backgroundColor: '#fee4e2', alignItems: 'center', justifyContent: 'center', padding: 4 },
  brokenText: { fontSize: 13, color: colors.danger, textAlign: 'center', fontWeight: '700' },
});
