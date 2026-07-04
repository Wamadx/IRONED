/** Schedule helpers: weekly (day-of-week) or rotating cycle (e.g. UA/LA/UB/LB/Rest → repeat). */

export type ScheduleMode = 'weekly' | 'cycle';

const DAY = 24 * 3600 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** slot for a given date: planId | 'rest' | null */
export function slotForDate(
  mode: ScheduleMode,
  weekly: (string | null)[],
  cycle: string[],
  cycleStart: number,
  ts: number
): string | null {
  if (mode === 'cycle') {
    if (cycle.length === 0) return null;
    const days = Math.round((startOfDay(ts) - startOfDay(cycleStart)) / DAY);
    const idx = ((days % cycle.length) + cycle.length) % cycle.length;
    return cycle[idx];
  }
  return weekly[new Date(ts).getDay()] ?? null;
}

/** 0-based position in the cycle for a date (cycle mode only) */
export function cycleIndexForDate(cycle: string[], cycleStart: number, ts: number): number {
  if (cycle.length === 0) return 0;
  const days = Math.round((startOfDay(ts) - startOfDay(cycleStart)) / DAY);
  return ((days % cycle.length) + cycle.length) % cycle.length;
}
