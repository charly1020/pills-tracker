import { dosesBetween, dosesOnDay, nextDose } from '../schedule';

const at = (d: string) => new Date(d); // local time, e.g. '2026-10-17T07:00:00'
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('dosesOnDay', () => {
  it('every 8h from 07:00 gives 07:00, 15:00, 23:00', () => {
    const doses = dosesOnDay({ anchorMinutes: 7 * 60, intervalHours: 8 }, at('2026-10-17T00:00:00'));
    expect(doses.map(hm)).toEqual(['07:00', '15:00', '23:00']);
  });

  it('every 24h gives a single daily dose', () => {
    const doses = dosesOnDay({ anchorMinutes: 9 * 60 + 30, intervalHours: 24 }, at('2026-10-17T00:00:00'));
    expect(doses.map(hm)).toEqual(['09:30']);
  });

  it('interval that does not divide 24 restarts at the anchor each day', () => {
    const spec = { anchorMinutes: 7 * 60, intervalHours: 5 };
    expect(dosesOnDay(spec, at('2026-10-17T00:00:00')).map(hm)).toEqual(['07:00', '12:00', '17:00', '22:00']);
    expect(dosesOnDay(spec, at('2026-10-18T00:00:00'))[0]).toEqual(at('2026-10-18T07:00:00'));
  });

  it('never puts two doses closer than the interval, even across days', () => {
    const doses = dosesBetween({ anchorMinutes: 7 * 60, intervalHours: 5 }, at('2026-10-17T00:00:00'), at('2026-10-20T00:00:00'));
    for (let i = 1; i < doses.length; i++) {
      expect(doses[i].getTime() - doses[i - 1].getTime()).toBeGreaterThanOrEqual(5 * 3600_000);
    }
  });

  it('an interval longer than a day still gives one dose per day', () => {
    expect(dosesOnDay({ anchorMinutes: 480, intervalHours: 30 }, at('2026-10-17T00:00:00')).map(hm)).toEqual(['08:00']);
  });

  it('doses past midnight spill onto the next calendar day', () => {
    const doses = dosesOnDay({ anchorMinutes: 20 * 60, intervalHours: 6 }, at('2026-10-17T00:00:00'));
    expect(doses).toEqual([at('2026-10-17T20:00:00'), at('2026-10-18T02:00:00'), at('2026-10-18T08:00:00'), at('2026-10-18T14:00:00')]);
  });
});

describe('dosesBetween', () => {
  const spec = { anchorMinutes: 7 * 60, intervalHours: 8 };

  it('returns doses in [from, to) in order, with no duplicates across days', () => {
    const doses = dosesBetween(spec, at('2026-10-17T10:00:00'), at('2026-10-19T00:00:00'));
    expect(doses).toEqual([
      at('2026-10-17T15:00:00'),
      at('2026-10-17T23:00:00'),
      at('2026-10-18T07:00:00'),
      at('2026-10-18T15:00:00'),
      at('2026-10-18T23:00:00'),
    ]);
  });

  it('includes a dose exactly at from, excludes one exactly at to', () => {
    const doses = dosesBetween(spec, at('2026-10-17T07:00:00'), at('2026-10-17T15:00:00'));
    expect(doses).toEqual([at('2026-10-17T07:00:00')]);
  });

  it('includes spill-over doses from the previous schedule day', () => {
    const late = { anchorMinutes: 20 * 60, intervalHours: 6 };
    const doses = dosesBetween(late, at('2026-10-18T00:00:00'), at('2026-10-18T09:00:00'));
    expect(doses).toEqual([at('2026-10-18T02:00:00'), at('2026-10-18T08:00:00')]);
  });

  it('returns nothing for an empty or inverted range', () => {
    expect(dosesBetween(spec, at('2026-10-17T10:00:00'), at('2026-10-17T10:00:00'))).toEqual([]);
    expect(dosesBetween(spec, at('2026-10-17T10:00:00'), at('2026-10-17T09:00:00'))).toEqual([]);
  });
});

describe('nextDose', () => {
  const spec = { anchorMinutes: 7 * 60, intervalHours: 8 };

  it('is strictly after the given time', () => {
    expect(nextDose(spec, at('2026-10-17T07:00:00'))).toEqual(at('2026-10-17T15:00:00'));
  });

  it('rolls over to the next day', () => {
    expect(nextDose(spec, at('2026-10-17T23:30:00'))).toEqual(at('2026-10-18T07:00:00'));
  });
});
