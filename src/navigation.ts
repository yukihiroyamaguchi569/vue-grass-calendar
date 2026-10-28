import { fromDayNumber, isIsoDate, toDayNumber } from './date';
import type { DateRange } from './grid';

// Columns are weeks and rows are days, so up/down moves a day and left/right a week.
const STEPS = new Map([
  ['ArrowUp', -1],
  ['ArrowDown', 1],
  ['ArrowLeft', -7],
  ['ArrowRight', 7],
]);

/** The date that an arrow key moves to, or null when the key is not an arrow or leaves the range. */
export function moveDate(date: string, key: string, range: DateRange): string | null {
  const step = STEPS.get(key);
  if (step === undefined) return null;
  // Compare day numbers, so moving past 9999-12-31 is caught before it becomes a date string.
  const next = toDayNumber(date) + step;
  return next < toDayNumber(range.start) || next > toDayNumber(range.end) ? null : fromDayNumber(next);
}

const inRange = (date: string | null | undefined, range: DateRange): date is string =>
  !!date && isIsoDate(date) && date >= range.start && date <= range.end;

/**
 * The cell that takes keyboard focus when tabbing in: the cell focused last,
 * then the selected date, then the last day, whichever is shown first.
 */
export function focusDate(focused: string | null, selected: string | null | undefined, range: DateRange): string {
  if (inRange(focused, range)) return focused;
  return inRange(selected, range) ? selected : range.end;
}
