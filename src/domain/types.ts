export type Pill = {
  id: number;
  name: string;
  reason: string;
  dose: string | null;
  notes: string | null;
  /** Local file URI of the pill photo, if any. */
  photoUri: string | null;
  anchorMinutes: number;
  intervalHours: number;
  /** Units left in stock; null when never entered. */
  stockQty: number | null;
  unitsPerDose: number;
  createdAt: number;
};

export type DoseState = 'pending' | 'snoozed' | 'taken' | 'missed';

export type DoseLog = {
  id: number;
  pillId: number;
  scheduledAt: number;
  state: DoseState;
  takenAt: number | null;
};
