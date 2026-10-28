import { addDays, toDayNumber } from './date';
import { rowOf, type DateRange, type WeekStart } from './grid';

export type Locale = 'ja' | 'en';

export interface MonthLabel {
  /** Column (week index) the label starts at. */
  column: number;
  text: string;
}

export const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS: Record<Locale, readonly string[]> = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

// Rough text metrics of the 11px label font, in px. Used only to keep labels apart.
const WIDE_CHAR_PX = 11;
const NARROW_CHAR_PX = 7;
const LABEL_GAP_PX = 4;

/** January labels carry the year, so a range that crosses years stays readable. */
export function monthLabelText(year: number, month: number, locale: Locale): string {
  if (locale === 'ja') return month === 1 ? `${year}年1月` : `${month}月`;
  return month === 1 ? `Jan ${year}` : EN_MONTHS[month - 1];
}

/** Number of columns a label covers, with some room after it. */
export function labelColumns(text: string, columnPx: number): number {
  let px = LABEL_GAP_PX;
  for (const char of text) px += char.charCodeAt(0) > 0xff ? WIDE_CHAR_PX : NARROW_CHAR_PX;
  return Math.ceil(px / columnPx);
}

function firstDaysOfMonths(range: DateRange): string[] {
  const days = [range.start];
  let [y, m] = range.start.split('-').map(Number);
  for (;;) {
    [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
    const first = `${y}-${String(m).padStart(2, '0')}-01`;
    if (first > range.end) return days;
    days.push(first);
  }
}

/**
 * Month labels above the grid. Each month is labelled at the column holding
 * its first day. When two labels would overlap, the later one is dropped,
 * except that a partial month at the start of the range gives way to the
 * next month (the same choice as the familiar contribution graph).
 */
export function monthLabels(range: DateRange, weekStart: WeekStart, locale: Locale, columnPx: number): MonthLabel[] {
  if (range.start > range.end) return [];
  const firstColumnDay = toDayNumber(addDays(range.start, -rowOf(range.start, weekStart)));
  const labels: (MonthLabel & { width: number })[] = [];
  for (const day of firstDaysOfMonths(range)) {
    const [y, m] = day.split('-').map(Number);
    const text = monthLabelText(y, m, locale);
    const label = {
      column: Math.floor((toDayNumber(day) - firstColumnDay) / 7),
      text,
      width: labelColumns(text, columnPx),
    };
    const prev = labels.at(-1);
    if (prev && label.column < prev.column + prev.width) {
      const prevIsPartialStart = labels.length === 1 && !range.start.endsWith('-01');
      if (!prevIsPartialStart) continue;
      labels.pop();
    }
    labels.push(label);
  }
  return labels.map(({ column, text }) => ({ column, text }));
}

// Like the familiar graph, only Monday, Wednesday and Friday are labelled.
const LABELLED_DAYS = new Set([1, 3, 5]);

/** Labels for the 7 rows, in the order the rows are drawn. */
export function weekdayLabels(locale: Locale, weekStart: WeekStart): string[] {
  return Array.from({ length: 7 }, (_, row) => {
    const day = (row + weekStart) % 7;
    return LABELLED_DAYS.has(day) ? WEEKDAYS[locale][day] : '';
  });
}
