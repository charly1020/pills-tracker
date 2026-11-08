import { formatClock, formatCountdown, formatDose, formatEvery, formatNextAt, formatUnits } from '../format';

describe('formatCountdown', () => {
  const min = 60_000;
  it('says "ahora" under a minute', () => expect(formatCountdown(30_000)).toBe('ahora'));
  it('uses minutes under an hour', () => expect(formatCountdown(25 * min)).toBe('en 25 min'));
  it('rounds up so it never shows a time that already passed', () => expect(formatCountdown(24 * min + 1)).toBe('en 25 min'));
  it('uses hours and minutes', () => expect(formatCountdown(2 * 60 * min + 10 * min)).toBe('en 2 h 10 min'));
  it('omits zero minutes', () => expect(formatCountdown(3 * 60 * min)).toBe('en 3 h'));
});

describe('formatClock', () => {
  it('pads hours and minutes', () => expect(formatClock(new Date(2026, 9, 17, 7, 5))).toBe('07:05'));
});

describe('formatUnits', () => {
  it('uses the singular for one', () => expect(formatUnits(1)).toBe('1 pastilla'));
  it('uses the plural otherwise', () => expect(formatUnits(2)).toBe('2 pastillas'));
});

describe('pill card lines', () => {
  it('formatEvery in whole hours', () => expect(formatEvery(480)).toBe('Cada 8 hs'));
  it('formatEvery in minutes under an hour', () => expect(formatEvery(30)).toBe('Cada 30 min'));
  it('formatEvery in hours and minutes', () => expect(formatEvery(90)).toBe('Cada 1 h 30 min'));
  it('formatNextAt pads the clock', () => expect(formatNextAt(new Date(2026, 9, 17, 7, 5))).toBe('Próxima a las 07:05 hs'));
});

describe('formatDose', () => {
  it('shows a text dose as typed', () => expect(formatDose({ dose: 'media', unitsPerDose: 0 })).toBe('media'));
  it('shows a numeric dose as a number, without a unit (pills or drops)', () => expect(formatDose({ dose: '2', unitsPerDose: 2 })).toBe('2'));
  it('falls back to the number for pills saved before the dose was text', () => expect(formatDose({ dose: null, unitsPerDose: 1 })).toBe('1'));
});
