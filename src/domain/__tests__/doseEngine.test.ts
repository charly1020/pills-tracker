import { dailySlots, GRACE_MS, graceFor, latestOccurrence, overdueDoses, snoozeAt } from '../doseEngine';
import type { Pill } from '../types';

const pill = (over: Partial<Pill>): Pill => ({
  id: 1, name: 'A', reason: '', dose: null, notes: null, photoUri: null,
  anchorMinutes: 7 * 60, intervalHours: 8, stockQty: null, unitsPerDose: 1, createdAt: 0, ...over,
});
const at = (s: string) => new Date(s);
const min = 60_000;

describe('dailySlots', () => {
  it('lists each clock time once per day', () => {
    const slots = dailySlots([pill({ id: 1 })]);
    expect(slots).toEqual([
      { minuteOfDay: 420, pillIds: [1] },
      { minuteOfDay: 900, pillIds: [1] },
      { minuteOfDay: 1380, pillIds: [1] },
    ]);
  });

  it('groups pills that are due at the same time into one slot', () => {
    const slots = dailySlots([pill({ id: 1 }), pill({ id: 2, anchorMinutes: 7 * 60, intervalHours: 24 })]);
    expect(slots.find((s) => s.minuteOfDay === 420)?.pillIds).toEqual([1, 2]);
    expect(slots).toHaveLength(3);
  });

  it('wraps past-midnight doses back into the 24h clock', () => {
    const slots = dailySlots([pill({ anchorMinutes: 20 * 60, intervalHours: 6 })]);
    expect(slots.map((s) => s.minuteOfDay)).toEqual([120, 480, 840, 1200]);
  });

  it('sorts by time of day', () => {
    const slots = dailySlots([pill({ id: 1, anchorMinutes: 22 * 60, intervalHours: 24 }), pill({ id: 2, anchorMinutes: 6 * 60, intervalHours: 24 })]);
    expect(slots.map((s) => s.minuteOfDay)).toEqual([360, 1320]);
  });
});

describe('latestOccurrence', () => {
  it('is today when the time already passed today', () => {
    expect(latestOccurrence(13 * 60 + 30, at('2026-10-17T14:35:00'))).toEqual(at('2026-10-17T13:30:00'));
  });
  it('is exactly now when it matches now', () => {
    expect(latestOccurrence(13 * 60 + 30, at('2026-10-17T13:30:00'))).toEqual(at('2026-10-17T13:30:00'));
  });
  it('is yesterday when it has not happened yet today', () => {
    expect(latestOccurrence(23 * 60, at('2026-10-17T00:20:00'))).toEqual(at('2026-10-16T23:00:00'));
  });
});

describe('snoozeAt', () => {
  const slot = at('2026-10-17T13:30:00');
  it('is five minutes after now', () => {
    expect(snoozeAt(at('2026-10-17T13:31:00'), slot)).toEqual(at('2026-10-17T13:36:00'));
  });
  it('is null when it would land at or after the one-hour limit', () => {
    expect(snoozeAt(at('2026-10-17T14:25:00'), slot)).toBeNull();
    expect(snoozeAt(at('2026-10-17T14:40:00'), slot)).toBeNull();
  });
  it('is still allowed when the new time lands just inside the limit', () => {
    expect(snoozeAt(at('2026-10-17T14:24:00'), slot)).toEqual(at('2026-10-17T14:29:00'));
  });
});

describe('graceFor', () => {
  it('is one hour for intervals of an hour or more', () => {
    expect(graceFor(8)).toBe(GRACE_MS);
    expect(graceFor(1)).toBe(GRACE_MS);
    expect(graceFor(24)).toBe(GRACE_MS);
  });
  it('is the interval itself when that is shorter, so a dose is missed once the next one is due', () => {
    expect(graceFor(0.5)).toBe(30 * 60_000);
    expect(graceFor(0.25)).toBe(15 * 60_000);
  });
});

describe('snoozeAt with a shorter grace period', () => {
  const slot = at('2026-10-17T13:30:00');
  it('stops snoozing sooner', () => {
    const grace = 30 * 60_000;
    expect(snoozeAt(at('2026-10-17T13:54:00'), slot, grace)).toEqual(at('2026-10-17T13:59:00'));
    expect(snoozeAt(at('2026-10-17T13:55:00'), slot, grace)).toBeNull();
  });
});

describe('overdueDoses', () => {
  it('uses each pill\'s own grace: a 15-minute pill is missed after 15 minutes', () => {
    const p = pill({ id: 1, anchorMinutes: 16 * 60, intervalHours: 0.25, createdAt: at('2026-10-17T15:59:00').getTime() });
    const res = overdueDoses([p], new Set(), at('2026-10-17T16:40:00'), 48 * 60 * min);
    expect(res.map((d) => d.at)).toEqual([at('2026-10-17T16:00:00'), at('2026-10-17T16:15:00')]);
  });

  it('finds doses past the grace period that were never logged', () => {
    const p = pill({ id: 1, createdAt: at('2026-10-17T00:00:00').getTime() });
    const res = overdueDoses([p], new Set(), at('2026-10-17T16:30:00'), 48 * 60 * min);
    expect(res.map((d) => [d.pillId, d.at.getTime()])).toEqual([
      [1, at('2026-10-17T07:00:00').getTime()],
      [1, at('2026-10-17T15:00:00').getTime()],
    ]);
  });

  it('does not report doses still inside the grace period', () => {
    const p = pill({ id: 1, createdAt: at('2026-10-17T00:00:00').getTime() });
    const res = overdueDoses([p], new Set(), at('2026-10-17T15:59:00'), 48 * 60 * min);
    expect(res.map((d) => d.at)).toEqual([at('2026-10-17T07:00:00')]);
  });

  it('skips doses that already have a log', () => {
    const p = pill({ id: 1, createdAt: at('2026-10-17T00:00:00').getTime() });
    const logged = new Set([`1:${at('2026-10-17T07:00:00').getTime()}`]);
    const res = overdueDoses([p], logged, at('2026-10-17T16:30:00'), 48 * 60 * min);
    expect(res.map((d) => d.at)).toEqual([at('2026-10-17T15:00:00')]);
  });

  it('never counts doses from before the pill existed', () => {
    const p = pill({ id: 1, createdAt: at('2026-10-17T10:00:00').getTime() });
    const res = overdueDoses([p], new Set(), at('2026-10-17T16:30:00'), 48 * 60 * min);
    expect(res.map((d) => d.at)).toEqual([at('2026-10-17T15:00:00')]);
  });

  it('only looks back as far as the lookback window', () => {
    const p = pill({ id: 1, createdAt: 0 });
    const res = overdueDoses([p], new Set(), at('2026-10-17T16:30:00'), 3 * 60 * min);
    expect(res.map((d) => d.at)).toEqual([at('2026-10-17T15:00:00')]);
  });

  it('GRACE_MS is one hour', () => expect(GRACE_MS).toBe(60 * min));
});
