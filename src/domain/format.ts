export function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "en 25 min", "en 2 h 10 min". Rounds up so it never claims a dose is later than it is. */
export function formatCountdown(ms: number): string {
  if (ms < 60_000) return 'ahora';
  const totalMinutes = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `en ${m} min`;
  return m === 0 ? `en ${h} h` : `en ${h} h ${m} min`;
}

export function formatUnits(units: number): string {
  return `${units} ${units === 1 ? 'pastilla' : 'pastillas'}`;
}

/** The dose as shown to the user, with no unit since it may be pills or drops: text as typed, or the number. */
export function formatDose(p: { dose: string | null; unitsPerDose: number }): string {
  const text = p.dose?.trim();
  if (text && !/^\d+$/.test(text)) return text;
  return String(p.unitsPerDose > 0 ? p.unitsPerDose : 1);
}

/** "Cada 8 hs", "Cada 30 min", "Cada 1 h 30 min". */
export function formatEvery(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `Cada ${m} min`;
  return m === 0 ? `Cada ${h} hs` : `Cada ${h} h ${m} min`;
}
export const formatNextAt = (at: Date) => `Próxima a las ${formatClock(at)} hs`;
