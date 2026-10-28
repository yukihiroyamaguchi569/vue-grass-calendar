import type { GrassCell } from './grid';
import { EN_MONTHS, type Locale } from './labels';

export function formatDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split('-').map(Number);
  return locale === 'ja' ? `${y}年${m}月${d}日` : `${EN_MONTHS[m - 1]} ${d}, ${y}`;
}

/** Default text of the tooltip and the accessible name of a cell. */
export function describeCell(cell: GrassCell, locale: Locale): string {
  const date = formatDate(cell.date, locale);
  if (cell.missing) return locale === 'ja' ? `${date}: 記録なし` : `${date}: no data`;
  return `${date}: ${cell.count.toLocaleString(locale)}`;
}

export const UI_TEXT: Record<Locale, { less: string; more: string; label: string }> = {
  ja: { less: '少ない', more: '多い', label: '日ごとの記録' },
  en: { less: 'Less', more: 'More', label: 'Daily activity' },
};
