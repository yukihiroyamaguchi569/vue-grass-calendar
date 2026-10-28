import { addDays, dayOfWeek, isIsoDate, localToday, oneYearBefore, toDayNumber } from './date';
import type { GrassDay } from './grid';

export interface SampleOptions {
  /** Last day of the data, 'YYYY-MM-DD'. Defaults to today in the local time zone. */
  end?: string;
  /** Number of days, ending on `end`. Defaults to one year, the calendar's default range (365 or 366 days). */
  days?: number;
  /** Seed of the random numbers. The same seed and options always give the same data. */
  seed?: number;
}

const MISSING_DAYS = 4;

// Small deterministic PRNG (mulberry32).
function random(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countFor(weekend: boolean, next: () => number): number {
  // Weekdays are busy and weekends quiet; some days have nothing at all.
  const [idleChance, maxCount] = weekend ? [0.6, 4] : [0.15, 12];
  if (next() < idleChance) return 0;
  const count = 1 + Math.floor(next() * maxCount);
  // A rare busy day, far above the rest, shows how the cap keeps outliers in check.
  return next() < 0.02 ? count * 15 : count;
}

/**
 * Made-up daily counts for trying the calendar: busy weekdays, quiet weekends,
 * days with nothing, a few outliers and a short stretch of missing days.
 */
export function createSampleData(options: SampleOptions = {}): GrassDay[] {
  const end = options.end ?? localToday();
  if (!isIsoDate(end)) throw new RangeError(`Invalid end date: ${end}`);
  const yearDays = toDayNumber(end) - toDayNumber(oneYearBefore(end)) + 1;
  const days = Math.max(0, Math.floor(options.days ?? yearDays));
  const next = random(options.seed ?? 1);
  const start = addDays(end, 1 - days);
  const missingFrom = Math.floor(days * (0.3 + next() * 0.4));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const count = countFor(dayOfWeek(date) % 6 === 0, next);
    const missing = i >= missingFrom && i < missingFrom + MISSING_DAYS;
    return missing ? { date, count: 0, missing } : { date, count };
  });
}
