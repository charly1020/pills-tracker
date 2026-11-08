import { nextDoseOverall } from '../next';
import type { Pill } from '../types';

const pill = (over: Partial<Pill>): Pill => ({
  id: 1, name: 'A', reason: '', dose: null, notes: null, photoUri: null,
  anchorMinutes: 7 * 60, intervalHours: 8, stockQty: null, unitsPerDose: 1, createdAt: 0, ...over,
});
const at = (s: string) => new Date(s);

describe('nextDoseOverall', () => {
  it('is null when there are no pills', () => {
    expect(nextDoseOverall([], at('2026-10-17T10:00:00'))).toBeNull();
  });

  it('picks the pill whose next dose is soonest', () => {
    const a = pill({ id: 1, name: 'A' }); // 07, 15, 23
    const b = pill({ id: 2, name: 'B', anchorMinutes: 12 * 60, intervalHours: 24 }); // 12:00
    const next = nextDoseOverall([a, b], at('2026-10-17T10:00:00'));
    expect(next?.pills.map((p) => p.name)).toEqual(['B']);
    expect(next?.at).toEqual(at('2026-10-17T12:00:00'));
  });

  it('groups pills due at the same moment', () => {
    const a = pill({ id: 1, name: 'A' });
    const b = pill({ id: 2, name: 'B' });
    const next = nextDoseOverall([a, b], at('2026-10-17T10:00:00'));
    expect(next?.pills.map((p) => p.name)).toEqual(['A', 'B']);
    expect(next?.at).toEqual(at('2026-10-17T15:00:00'));
  });
});
