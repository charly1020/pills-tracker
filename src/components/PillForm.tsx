import { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PillDraft } from '../db/repository';
import { formatClock, formatEvery } from '../domain/format';
import { intervalMinutes as toMinutes } from '../domain/schedule';
import { validatePillForm } from '../domain/pillForm';
import { deletePhoto, pickPhoto } from '../photos/photos';
import { colors, text } from '../theme';
import { BigButton } from './BigButton';
import { Stepper } from './Stepper';

type Props = {
  initial?: PillDraft;
  onSave: (draft: PillDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const fail = (e: unknown) => Alert.alert('Error', e instanceof Error ? e.message : String(e));
const confirm = (title: string, message: string, action: string, danger = false) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: danger ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { onDismiss: () => resolve(false) })
  );

export function PillForm({ initial, onSave, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [hour, setHour] = useState(initial ? Math.floor(initial.anchorMinutes / 60) : 8);
  const [minute, setMinute] = useState(initial ? initial.anchorMinutes % 60 : 0);
  // The interval is either whole hours or minutes; a stored 1.5 h opens as 90 minutes.
  const initialMinutes = initial ? toMinutes(initial.intervalHours) : 480;
  const startsInHours = initialMinutes % 60 === 0 && initialMinutes <= 24 * 60;
  const [intervalUnit, setIntervalUnit] = useState<'hours' | 'minutes'>(startsInHours ? 'hours' : 'minutes');
  const [intervalHoursValue, setIntervalHoursValue] = useState(startsInHours ? initialMinutes / 60 : 8);
  const [intervalMinutesValue, setIntervalMinutesValue] = useState(startsInHours ? 30 : initialMinutes);
  const intervalMinutes = intervalUnit === 'hours' ? intervalHoursValue * 60 : intervalMinutesValue;
  const [stockQty, setStockQty] = useState(initial?.stockQty != null ? String(initial.stockQty) : '');
  // Pills saved before the dose became text have no dose string: start from their number of pills.
  const [dose, setDose] = useState(initial?.dose ?? (initial && initial.unitsPerDose > 0 ? String(initial.unitsPerDose) : '1'));
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoProblem, setPhotoProblem] = useState<string | null>(null);

  // A photo taken in this form but never saved must not be left behind in storage.
  const originalPhoto = useRef(initial?.photoUri ?? null);
  const latestPhoto = useRef(photoUri);
  const saved = useRef(false);
  latestPhoto.current = photoUri;
  useEffect(
    () => () => {
      if (!saved.current && latestPhoto.current !== originalPhoto.current) deletePhoto(latestPhoto.current);
    },
    []
  );

  const replacePhoto = (next: string | null) => {
    setPhotoProblem(null);
    if (photoUri && photoUri !== originalPhoto.current) deletePhoto(photoUri);
    setPhotoUri(next);
  };
  const takePhoto = (source: 'camera' | 'gallery') =>
    pickPhoto(source).then((uri) => uri && replacePhoto(uri)).catch(fail);

  const save = async () => {
    const res = validatePillForm({ name, reason, notes, hour, minute, intervalMinutes, stockQty, dose, photoUri });
    if (!res.ok) return setErrors(res.errors);
    setErrors({});
    if (initial && !(await confirm('Guardar cambios', `¿Guardar los cambios de ${res.draft.name}?`, 'Guardar'))) return;
    try {
      await onSave(res.draft);
      saved.current = true;
      if (originalPhoto.current && originalPhoto.current !== photoUri) deletePhoto(originalPhoto.current);
    } catch (e) {
      fail(e);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (await confirm('Borrar pastilla', `¿Borrar ${initial?.name}? No se puede deshacer.`, 'Borrar', true)) {
      onDelete().catch(fail);
    }
  };

  const field = (label: string, value: string, set: (v: string) => void, extra?: object, error?: string) => (
    <View style={styles.field}>
      <Text style={text.small}>{label}</Text>
      <TextInput style={[styles.input, error ? { borderColor: colors.danger } : null]} value={value} onChangeText={set} {...extra} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
      {field('Nombre', name, setName, { autoCapitalize: 'sentences' }, errors.name)}
      {field('¿Para qué es?', reason, setReason)}
      {field('Pastillas/gotas por toma', dose, setDose, { selectTextOnFocus: true }, errors.dose)}
      <Text style={text.small}>Escribe un número (1, 2, 10 gotas…) o un texto (media, 5 ml). Con texto no se descuenta de lo que queda en la caja.</Text>

      <Text style={text.heading}>Primera toma</Text>
      <View style={styles.timeRow}>
        <Stepper label="Hora" value={hour} min={0} max={23} format={(v) => String(v).padStart(2, '0')} onChange={setHour} />
        <Stepper label="Minutos" value={minute} min={0} max={55} step={5} format={(v) => String(v).padStart(2, '0')} onChange={setMinute} />
      </View>

      <Text style={text.heading}>Cada cuánto</Text>
      <View style={styles.row}>
        <BigButton title="Horas" onPress={() => setIntervalUnit('hours')} outline={intervalUnit !== 'hours'} compact />
        <BigButton title="Minutos" onPress={() => setIntervalUnit('minutes')} outline={intervalUnit !== 'minutes'} compact />
      </View>
      {intervalUnit === 'hours' ? (
        <Stepper label="Horas" value={intervalHoursValue} min={1} max={24} onChange={setIntervalHoursValue} />
      ) : (
        <Stepper label="Minutos" value={intervalMinutesValue} min={5} max={180} step={5} onChange={setIntervalMinutesValue} />
      )}
      {errors.interval ? <Text style={styles.error}>{errors.interval}</Text> : null}
      <Text style={text.small}>
        Primera toma del día a las {formatClock(new Date(2000, 0, 1, hour, minute))}, y luego {formatEvery(intervalMinutes).toLowerCase()}.
      </Text>

      <Text style={text.heading}>Cantidad</Text>
      {field('Pastillas/gotas en la caja (opcional)', stockQty, setStockQty, { keyboardType: 'number-pad' }, errors.stockQty)}

      <Text style={text.heading}>Foto</Text>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          onError={(e) => setPhotoProblem(e.nativeEvent.error ?? 'error desconocido')}
        />
      ) : (
        <Text style={text.small}>Sin foto</Text>
      )}
      {photoProblem ? <Text style={styles.error}>No se puede mostrar la foto: {photoProblem}</Text> : null}
      <View style={styles.row}>
        <BigButton title="Tomar foto" onPress={() => takePhoto('camera')} outline compact />
        <BigButton title="Elegir de galería" onPress={() => takePhoto('gallery')} outline compact />
      </View>
      {photoUri ? <BigButton title="Quitar foto" onPress={() => replacePhoto(null)} color={colors.danger} outline /> : null}

      {field('Notas (opcional)', notes, setNotes, { multiline: true })}

      <BigButton title="Guardar" onPress={save} color={colors.success} />
      {onDelete ? <BigButton title="Borrar pastilla" onPress={remove} color={colors.danger} outline /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: colors.bg },
  field: { gap: 4 },
  input: { fontSize: 22, borderWidth: 2, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  error: { fontSize: 18, color: colors.danger, fontWeight: '600' },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.card },
});
