import { dosesBetween, dosesOnDay } from './schedule';
import type { Pill } from './types';

export const SNOOZE_MS = 5 * 60_000;
/** An ignored dose is recorded as missed this long after it was due. */
export const GRACE_MS = 60 * 60_000;

/** The grace period for a pill: one hour, or less when the next dose is due sooner (a dose is missed once the next one is due). */
export const graceFor = (intervalHours: number) => Math.min(GRACE_MS, Math.round(intervalHours * 3_600_000));

export type Slot = { minuteOfDay: number; pillIds: number[] };

/** Clock times (minutes after midnight) at which something rings each day, with the pills due then. */
export function dailySlots(pills: Pill[]): Slot[] {
  const reference = new Date(2001, 0, 1); // any day: the daily pattern is the same every day
  const byMinute = new Map<number, number[]>();
  for (const pill of pills) {
    const spec = { anchorMinutes: pill.anchorMinutes, intervalHours: pill.intervalHours };
    for (const dose of dosesOnDay(spec, reference)) {
      const minute = dose.getHours() * 60 + dose.getMinutes();
      byMinute.set(minute, [...(byMinute.get(minute) ?? []), pill.id]);
    }
  }
  return [...byMinute.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minuteOfDay, pillIds]) => ({ minuteOfDay, pillIds }));
}

/** The most recent moment at or before `now` whose clock time is `minuteOfDay`. */
export function latestOccurrence(minuteOfDay: number, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, minuteOfDay);
  if (today <= now) return today;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, minuteOfDay);
}

/** When a snoozed alarm should ring again, or null if that would be past the one-hour limit. */
export function snoozeAt(now: Date, slotAt: Date, graceMs = GRACE_MS): Date | null {
  const next = new Date(now.getTime() + SNOOZE_MS);
  return next.getTime() < slotAt.getTime() + graceMs ? next : null;
}

export const doseKey = (pillId: number, at: Date | number) => `${pillId}:${typeof at === 'number' ? at : at.getTime()}`;

export type OverdueDose = { pillId: number; at: Date };

/** Doses past the grace period with no log (taken or missed yet). Ignores doses from before the pill was added. */
export function overdueDoses(pills: Pill[], logged: Set<string>, now: Date, lookbackMs: number): OverdueDose[] {
  const out: OverdueDose[] = [];
  for (const pill of pills) {
    const to = new Date(now.getTime() - graceFor(pill.intervalHours) + 1); // doses due at or before now - grace
    const from = new Date(Math.max(pill.createdAt, now.getTime() - lookbackMs));
    const spec = { anchorMinutes: pill.anchorMinutes, intervalHours: pill.intervalHours };
    for (const at of dosesBetween(spec, from, to)) {
      if (!logged.has(doseKey(pill.id, at))) out.push({ pillId: pill.id, at });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime() || a.pillId - b.pillId);
}
