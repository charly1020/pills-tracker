import type { PillDraft } from '../db/repository';
import { dosesOnDay } from './schedule';

const MIN_INTERVAL_MINUTES = 5;
const MAX_INTERVAL_MINUTES = 24 * 60;
const MAX_ALARMS_PER_DAY = 100;

export type PillFormInput = {
  name: string;
  reason: string;
  notes: string;
  hour: number;
  minute: number;
  /** Time between doses, in minutes (5 to 1440). */
  intervalMinutes: number;
  /** Text as typed; empty means "not tracking stock". */
  stockQty: string;
  /** Dose per intake as typed: a whole number ("2") counts against stock, any other text ("media") does not. */
  dose: string;
  photoUri: string | null;
};

export type PillFormResult =
  | { ok: true; draft: PillDraft }
  | { ok: false; errors: Partial<Record<'name' | 'dose' | 'interval' | 'stockQty', string>> };

const emptyToNull = (s: string) => (s.trim() === '' ? null : s.trim());
const wholeNumber = /^\d+$/;

export function validatePillForm(input: PillFormInput): PillFormResult {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  if (name === '') errors.name = 'Escribe el nombre';
  if (!(input.intervalMinutes >= MIN_INTERVAL_MINUTES && input.intervalMinutes <= MAX_INTERVAL_MINUTES)) {
    errors.interval = 'Entre 5 minutos y 24 horas';
  } else {
    const spec = { anchorMinutes: input.hour * 60 + input.minute, intervalHours: input.intervalMinutes / 60 };
    if (dosesOnDay(spec, new Date(2001, 0, 1)).length > MAX_ALARMS_PER_DAY) {
      errors.interval = `Demasiadas alarmas al día (máximo ${MAX_ALARMS_PER_DAY}): elige un intervalo mayor`;
    }
  }

  const stockText = input.stockQty.trim();
  let stockQty: number | null = null;
  if (stockText !== '') {
    if (wholeNumber.test(stockText)) stockQty = Number(stockText);
    else errors.stockQty = 'Escribe un número entero';
  }

  // A whole number is also how much stock each intake uses; anything else is just text and uses none (0).
  const doseText = input.dose.trim();
  const isNumeric = wholeNumber.test(doseText);
  const unitsPerDose = isNumeric ? Number(doseText) : 0;
  if (doseText === '') errors.dose = 'Escribe la dosis';
  else if (isNumeric && unitsPerDose < 1) errors.dose = 'La dosis no puede ser 0';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    draft: {
      name,
      reason: input.reason.trim(),
      dose: doseText,
      notes: emptyToNull(input.notes),
      photoUri: input.photoUri,
      anchorMinutes: input.hour * 60 + input.minute,
      intervalHours: input.intervalMinutes / 60,
      stockQty,
      unitsPerDose,
    },
  };
}
