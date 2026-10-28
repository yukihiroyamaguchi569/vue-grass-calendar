import { addDays, dayOfWeek, isIsoDate, oneYearBefore, toDayNumber } from './date';
import { levelOf, type Levels } from './levels';

export interface GrassDay {
  date: string;
  count: number;
  missing?: boolean;
}

export interface GrassCell {
  date: string;
  count: number;
  missing: boolean;
  level: number;
}

/** One column of the grid. `cells` has 7 rows; days outside the range are null. */
export interface GrassWeek {
  key: string;
  cells: (GrassCell | null)[];
}

export interface DateRange {
  start: string;
  end: string;
}

export type WeekStart = 0 | 1;

/**
 * Fills in the range from the props. A missing or invalid `end` becomes today,
 * a missing or invalid `start` becomes one year before `end`.
 */
export function resolveRange(start: string | undefined, end: string | undefined, today: string): DateRange {
  const resolvedEnd = end !== undefined && isIsoDate(end) ? end : today;
  const resolvedStart = start !== undefined && isIsoDate(start) ? start : oneYearBefore(resolvedEnd);
  return { start: resolvedStart, end: resolvedEnd };
}

/**
 * Collects the entries inside the range by date. Counts on the same date are
 * added up; a date is missing only when every entry for it is missing.
 * Entries with an invalid date are ignored, and invalid counts count as 0.
 */
export function aggregateDays(
  data: readonly GrassDay[],
  range: DateRange,
): Map<string, { count: number; missing: boolean }> {
  const byDate = new Map<string, { count: number; missing: boolean }>();
  for (const day of data) {
    if (!isIsoDate(day.date) || day.date < range.start || day.date > range.end) continue;
    const count = Number.isFinite(day.count) && day.count > 0 ? day.count : 0;
    const missing = day.missing === true;
    const prev = byDate.get(day.date);
    byDate.set(day.date, prev ? { count: prev.count + count, missing: prev.missing && missing } : { count, missing });
  }
  return byDate;
}

/** Row of a date in its column, counted from the first day of the week. */
export function rowOf(date: string, weekStart: WeekStart): number {
  return (dayOfWeek(date) - weekStart + 7) % 7;
}

export function buildWeeks(
  data: readonly GrassDay[],
  range: DateRange,
  weekStart: WeekStart,
  levels: Levels,
): GrassWeek[] {
  if (range.start > range.end) return [];
  const byDate = aggregateDays(data, range);
  const firstDay = addDays(range.start, -rowOf(range.start, weekStart));
  const totalDays = toDayNumber(range.end) - toDayNumber(firstDay) + 1;
  const weeks: GrassWeek[] = [];
  for (let offset = 0; offset < totalDays; offset += 7) {
    const key = addDays(firstDay, offset);
    const cells = Array.from({ length: 7 }, (_, row) => {
      const date = addDays(key, row);
      if (date < range.start || date > range.end) return null;
      const entry = byDate.get(date) ?? { count: 0, missing: false };
      return { date, ...entry, level: entry.missing ? 0 : levelOf(entry.count, levels) };
    });
    weeks.push({ key, cells });
  }
  return weeks;
}
