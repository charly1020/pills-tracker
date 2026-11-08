import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';

import { scaled } from '../domain/textSize';
import { useTextSize } from '../settings/textSize';
import { colors, text } from '../theme';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
};

/** Big − / + buttons: easier than a keyboard or a spinner for older users. Wraps around at the ends. */
export function Stepper({ label, value, min, max, step = 1, format = String, onChange }: Props) {
  const { scale } = useTextSize();
  const size = scaled(44, scale);
  const btn = { width: size, height: size, borderRadius: size / 2 };
  const bump = (dir: 1 | -1) => {
    const next = value + dir * step;
    onChange(next > max ? min : next < min ? max - ((max - min) % step) : next);
  };
  return (
    <View style={[styles.box, { minWidth: scaled(170, scale) }]}>
      <Text style={text.small}>{label}</Text>
      <View style={styles.row}>
        <Pressable accessibilityLabel={`${label} menos`} style={[styles.btn, btn]} onPress={() => bump(-1)}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{format(value)}</Text>
        <Pressable accessibilityLabel={`${label} más`} style={[styles.btn, btn]} onPress={() => bump(1)}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // flexGrow with a minimum width: two steppers share a line when they fit and wrap to two lines when they don't.
  box: { flexGrow: 1, gap: 6, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 28, fontWeight: '700', color: colors.primary },
  value: { fontSize: 28, fontWeight: '800', minWidth: 40, textAlign: 'center', color: colors.text },
});
