// Calendar dates are handled as 'YYYY-MM-DD' strings and converted to
// day numbers (days since 1970-01-01, UTC) for arithmetic, so that time
// zones and daylight saving time never shift a day.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Day number of a calendar date. Unlike Date.UTC, years 0-99 are not moved to 1900-1999. */
function utcDay(year: number, monthIndex: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  return date.getTime() / MS_PER_DAY;
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(utcDay(y, m - 1, d) * MS_PER_DAY);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function toDayNumber(iso: string): number {
  if (!isIsoDate(iso)) throw new RangeError(`Invalid date: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number);
  return utcDay(y, m - 1, d);
}

export function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

export function dayOfWeek(iso: string): DayOfWeek {
  // 1970-01-01 was a Thursday (4).
  return ((((toDayNumber(iso) + 4) % 7) + 7) % 7) as DayOfWeek;
}

/** The first day of the one-year window that ends on `end` (inclusive). */
export function oneYearBefore(end: string): string {
  const [y, m, d] = end.split('-').map(Number);
  // Day 0 of the next month is the last day of this month, so Feb 29 maps to Feb 28.
  const lastDay = new Date(utcDay(y - 1, m, 0) * MS_PER_DAY).getUTCDate();
  return fromDayNumber(utcDay(y - 1, m - 1, Math.min(d, lastDay)) + 1);
}

/** Today's date in the local time zone. The clock is injectable for tests. */
export function localToday(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
