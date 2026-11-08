import type { BackupData } from '../domain/backup';
import type { DoseLog, Pill } from '../domain/types';
import { getDb } from './database';

type PillRow = {
  id: number; name: string; reason: string; dose: string | null; notes: string | null; photo_uri: string | null;
  anchor_minutes: number; interval_hours: number; stock_qty: number | null; units_per_dose: number; created_at: number;
};
type DoseRow = { id: number; pill_id: number; scheduled_at: number; state: DoseLog['state']; taken_at: number | null };

const toPill = (r: PillRow): Pill => ({
  id: r.id, name: r.name, reason: r.reason, dose: r.dose, notes: r.notes, photoUri: r.photo_uri,
  anchorMinutes: r.anchor_minutes, intervalHours: r.interval_hours, stockQty: r.stock_qty,
  unitsPerDose: r.units_per_dose, createdAt: r.created_at,
});
const toDose = (r: DoseRow): DoseLog => ({
  id: r.id, pillId: r.pill_id, scheduledAt: r.scheduled_at, state: r.state, takenAt: r.taken_at,
});

export type PillDraft = Omit<Pill, 'id' | 'createdAt'>;

export async function listPills(): Promise<Pill[]> {
  const db = await getDb();
  return (await db.getAllAsync<PillRow>('SELECT * FROM pills ORDER BY anchor_minutes, name')).map(toPill);
}

export async function listDoses(): Promise<DoseLog[]> {
  const db = await getDb();
  return (await db.getAllAsync<DoseRow>('SELECT * FROM doses ORDER BY scheduled_at')).map(toDose);
}

export async function insertPill(draft: PillDraft, now = Date.now()): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO pills (name, reason, dose, notes, photo_uri, anchor_minutes, interval_hours, stock_qty, units_per_dose, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draft.name, draft.reason, draft.dose, draft.notes, draft.photoUri,
    draft.anchorMinutes, draft.intervalHours, draft.stockQty, draft.unitsPerDose, now
  );
  return res.lastInsertRowId;
}

export async function getPill(id: number): Promise<Pill | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PillRow>('SELECT * FROM pills WHERE id = ?', id);
  return row ? toPill(row) : null;
}

export async function updatePill(id: number, draft: PillDraft) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE pills SET name = ?, reason = ?, dose = ?, notes = ?, photo_uri = ?, anchor_minutes = ?,
       interval_hours = ?, stock_qty = ?, units_per_dose = ? WHERE id = ?`,
    draft.name, draft.reason, draft.dose, draft.notes, draft.photoUri,
    draft.anchorMinutes, draft.intervalHours, draft.stockQty, draft.unitsPerDose, id
  );
}

export async function deletePill(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pills WHERE id = ?', id);
}

/** Replaces everything with the backup contents, atomically: on any error nothing changes. */
export async function replaceAll({ pills, doses }: BackupData) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM doses');
    await db.runAsync('DELETE FROM pills');
    for (const p of pills) {
      await db.runAsync(
        `INSERT INTO pills (id, name, reason, dose, notes, photo_uri, anchor_minutes, interval_hours, stock_qty, units_per_dose, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id, p.name, p.reason, p.dose, p.notes, p.photoUri, p.anchorMinutes, p.intervalHours, p.stockQty, p.unitsPerDose, p.createdAt
      );
    }
    for (const d of doses) {
      await db.runAsync(
        'INSERT INTO doses (id, pill_id, scheduled_at, state, taken_at) VALUES (?, ?, ?, ?, ?)',
        d.id, d.pillId, d.scheduledAt, d.state, d.takenAt
      );
    }
  });
}

/**
 * Records a dose as taken and reduces stock, exactly once: calling it again for the same dose does nothing.
 * Returns true when this call recorded it.
 */
export async function markTaken(pillId: number, scheduledAt: number, takenAt: number): Promise<boolean> {
  const db = await getDb();
  let recorded = false;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT OR IGNORE INTO doses (pill_id, scheduled_at, state, taken_at) VALUES (?, ?, 'taken', ?)",
      pillId, scheduledAt, takenAt
    );
    recorded = res.changes > 0;
    if (recorded) {
      await db.runAsync(
        // units_per_dose is 0 for a text dose ("media"): nothing is subtracted
        'UPDATE pills SET stock_qty = MAX(0, stock_qty - units_per_dose) WHERE id = ? AND stock_qty IS NOT NULL AND units_per_dose > 0',
        pillId
      );
    }
  });
  return recorded;
}

/** Keys ("pillId:scheduledAt") of every dose logged at or after `sinceMs`. */
export async function loggedDoseKeys(sinceMs: number): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ pill_id: number; scheduled_at: number }>(
    'SELECT pill_id, scheduled_at FROM doses WHERE scheduled_at >= ?', sinceMs
  );
  return new Set(rows.map((r) => `${r.pill_id}:${r.scheduled_at}`));
}

export async function insertMissed(doses: { pillId: number; at: Date }[]) {
  if (doses.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const d of doses) {
      await db.runAsync(
        "INSERT OR IGNORE INTO doses (pill_id, scheduled_at, state, taken_at) VALUES (?, ?, 'missed', NULL)",
        d.pillId, d.at.getTime()
      );
    }
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}
