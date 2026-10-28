import type { GrassCell } from './grid';
import { EN_MONTHS, type Locale } from './labels';

export function formatDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split('-').map(Number);
  return locale === 'ja' ? `${y}年${m}月${d}日` : `${EN_MONTHS[m - 1]} ${d}, ${y}`;
}

/** Default count text with a unit, e.g. "6 件" or "1 contribution". */
export function formatCount(count: number, locale: Locale): string {
  const n = count.toLocaleString(locale);
  if (locale === 'ja') return `${n} 件`;
  return count === 1 ? `${n} contribution` : `${n} contributions`;
}

/** Default text of the tooltip and the accessible name of a cell. */
export function describeCell(
  cell: GrassCell,
  locale: Locale,
  countText: (count: number) => string = (count) => formatCount(count, locale),
): string {
  const date = formatDate(cell.date, locale);
  if (cell.missing) return locale === 'ja' ? `${date}: 記録なし` : `${date}: no data`;
  return `${date}: ${countText(cell.count)}`;
}

export const UI_TEXT: Record<Locale, { less: string; more: string; label: string }> = {
  ja: { less: '少ない', more: '多い', label: '日ごとの記録' },
  en: { less: 'Less', more: 'More', label: 'Daily activity' },
};
