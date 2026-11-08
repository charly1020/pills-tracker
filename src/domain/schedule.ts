export type ScheduleSpec = {
  /** Minutes after local midnight of the first dose of the day (07:00 = 420). */
  anchorMinutes: number;
  /** Hours between doses. Each day restarts at the anchor. */
  intervalHours: number;
};

const MINUTES_PER_DAY = 24 * 60;

/** Whole minutes between doses, for a stored interval in hours (0.5 h = 30 min). */
export const intervalMinutes = (intervalHours: number) => Math.round(intervalHours * 60);

function stepMinutes({ intervalHours }: ScheduleSpec) {
  const step = Math.round(intervalHours * 60);
  if (!(step > 0)) throw new Error(`Invalid interval: ${intervalHours}h`);
  return step;
}

/**
 * Doses of the schedule day starting at `day`'s anchor. Late ones spill past midnight.
 * A dose is dropped if it would fall less than one interval before the next day's anchor,
 * so two consecutive doses are never closer together than the prescribed interval.
 */
export function dosesOnDay(spec: ScheduleSpec, day: Date): Date[] {
  const step = stepMinutes(spec);
  const doses: Date[] = [];
  for (let offset = 0; offset === 0 || offset + step <= MINUTES_PER_DAY; offset += step) {
    doses.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, spec.anchorMinutes + offset));
  }
  return doses;
}

/** Doses due in [from, to), in chronological order. */
export function dosesBetween(spec: ScheduleSpec, from: Date, to: Date): Date[] {
  if (to <= from) return [];
  const doses: Date[] = [];
  // Start one day early so spill-over doses from the previous schedule day are included.
  const firstDay = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
  const lastDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  for (let day = firstDay; day <= lastDay; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    for (const dose of dosesOnDay(spec, day)) {
      if (dose >= from && dose < to) doses.push(dose);
    }
  }
  return doses.sort((a, b) => a.getTime() - b.getTime());
}

/** First dose strictly after `after`. */
export function nextDose(spec: ScheduleSpec, after: Date): Date {
  const from = new Date(after.getTime() + 1);
  const to = new Date(after.getTime() + 2 * MINUTES_PER_DAY * 60_000);
  return dosesBetween(spec, from, to)[0];
}
