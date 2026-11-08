import { Pressable, StyleSheet } from 'react-native';
import { Text } from './AppText';

import { colors } from '../theme';

type Props = { title: string; onPress: () => void; color?: string; outline?: boolean; compact?: boolean };

export function BigButton({ title, onPress, color = colors.primary, outline, compact }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        outline ? { borderWidth: 2, borderColor: color, backgroundColor: colors.bg } : { backgroundColor: color },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.text, compact && styles.compactText, { color: outline ? color : '#fff' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 18, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  text: { fontSize: 22, fontWeight: '700' },
  // Fits side by side on a narrow phone: smaller text that wraps instead of overflowing.
  compact: { flex: 1, paddingHorizontal: 8 },
  compactText: { fontSize: 19, textAlign: 'center' },
});
