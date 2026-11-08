import { nextDose } from './schedule';
import type { Pill } from './types';

export type NextDose = { at: Date; pills: Pill[] };

/** The soonest upcoming dose across all pills, grouping pills due at the same moment. */
export function nextDoseOverall(pills: Pill[], now: Date): NextDose | null {
  let best: NextDose | null = null;
  for (const pill of pills) {
    const at = nextDose({ anchorMinutes: pill.anchorMinutes, intervalHours: pill.intervalHours }, now);
    if (!best || at < best.at) best = { at, pills: [pill] };
    else if (at.getTime() === best.at.getTime()) best.pills.push(pill);
  }
  return best;
}
