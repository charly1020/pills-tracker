import type { DoseLog, DoseState, Pill } from './types';

export const BACKUP_APP = 'pills-tracker';
export const BACKUP_VERSION = 1;

/** Photos by pill id, embedded in the file so a backup is a single self-contained file. */
export type BackupPhotos = Record<number, { base64: string; ext: string }>;
export type BackupData = { pills: Pill[]; doses: DoseLog[]; photos?: BackupPhotos };

const DOSE_STATES: DoseState[] = ['pending', 'snoozed', 'taken', 'missed'];

export function serializeBackup(data: BackupData, now = new Date()): string {
  return JSON.stringify({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data });
}

const invalid = (what: string) => new Error(`Copia inválida: ${what}`);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrOrNull = (v: unknown) => v === null || typeof v === 'string';
const isNumOrNull = (v: unknown) => v === null || isNum(v);

function checkPill(p: any): Pill {
  const ok =
    p &&
    isNum(p.id) &&
    typeof p.name === 'string' && p.name.trim() !== '' &&
    typeof p.reason === 'string' &&
    isStrOrNull(p.dose) && isStrOrNull(p.notes) && isStrOrNull(p.photoUri) &&
    isNum(p.anchorMinutes) && p.anchorMinutes >= 0 && p.anchorMinutes < 24 * 60 &&
    isNum(p.intervalHours) && p.intervalHours > 0 &&
    isNumOrNull(p.stockQty) && (p.stockQty === null || p.stockQty >= 0) &&
    isNum(p.unitsPerDose) && p.unitsPerDose >= 0 &&
    isNum(p.createdAt);
  if (!ok) throw invalid(`pastilla ${p?.name ?? '?'}`);
  return p as Pill;
}

function checkDose(d: any, pillIds: Set<number>): DoseLog {
  const ok =
    d && isNum(d.id) && pillIds.has(d.pillId) && isNum(d.scheduledAt) &&
    DOSE_STATES.includes(d.state) && isNumOrNull(d.takenAt);
  if (!ok) throw invalid('historial');
  return d as DoseLog;
}

export function parseBackup(text: string): Required<BackupData> {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Este archivo no es una copia de Pills Tracker');
  }
  if (!raw || raw.app !== BACKUP_APP || !Array.isArray(raw.pills)) {
    throw new Error('Este archivo no es una copia de Pills Tracker');
  }
  if (raw.version > BACKUP_VERSION) {
    throw new Error('La copia viene de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.');
  }
  const pills = raw.pills.map(checkPill);
  const ids = new Set<number>(pills.map((p: Pill) => p.id));
  const doses = (Array.isArray(raw.doses) ? raw.doses : []).map((d: unknown) => checkDose(d, ids));
  const photos: BackupPhotos = {};
  for (const [key, value] of Object.entries(raw.photos ?? {}) as [string, any][]) {
    const id = Number(key);
    if (!ids.has(id) || typeof value?.base64 !== 'string' || typeof value?.ext !== 'string') throw invalid('foto');
    photos[id] = { base64: value.base64, ext: value.ext };
  }
  return { pills, doses, photos };
}
