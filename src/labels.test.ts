import { describe, expect, it } from 'vitest';
import { labelColumns, monthLabels, monthLabelText, weekdayLabels } from './labels';

const PITCH = 14;

describe('monthLabelText', () => {
  it('shows the year only on January', () => {
    expect(monthLabelText(2027, 1, 'ja')).toBe('2027年1月');
    expect(monthLabelText(2026, 10, 'ja')).toBe('10月');
    expect(monthLabelText(2027, 1, 'en')).toBe('Jan 2027');
    expect(monthLabelText(2026, 12, 'en')).toBe('Dec');
  });
});

describe('labelColumns', () => {
  it('measures wide (CJK) characters wider than ASCII', () => {
    expect(labelColumns('Oct', PITCH)).toBe(2);
    expect(labelColumns('10月', PITCH)).toBe(3);
    expect(labelColumns('2027年1月', PITCH)).toBe(5);
  });
});

describe('monthLabels', () => {
  it('labels every month of a range that starts on the 1st', () => {
    const labels = monthLabels({ start: '2026-01-01', end: '2026-12-31' }, 0, 'en', PITCH);
    expect(labels.map((l) => l.text)).toEqual([
      'Jan 2026',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]);
    expect(labels[0].column).toBe(0);
  });
  it('keeps the month after a year label when there is room', () => {
    // With Sunday-first weeks, 2026-02-01 is 5 columns after 2026-01-01.
    const labels = monthLabels({ start: '2025-10-29', end: '2026-10-28' }, 0, 'ja', PITCH);
    expect(labels.map((l) => l.text)).toEqual([
      '11月',
      '12月',
      '2026年1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
    ]);
  });
  it('places a label at the column holding the first day of the month', () => {
    // 2026-11-01 is a Sunday: column 1 when weeks start on Sunday, still column 0 when they start on Monday.
    const range = { start: '2026-10-26', end: '2026-12-31' };
    expect(monthLabels(range, 0, 'en', PITCH).find((l) => l.text === 'Nov')?.column).toBe(1);
    expect(monthLabels(range, 1, 'en', PITCH).find((l) => l.text === 'Nov')?.column).toBe(0);
  });
  it('drops a partial first month that would overlap the next label', () => {
    const labels = monthLabels({ start: '2026-10-28', end: '2026-12-31' }, 0, 'ja', PITCH);
    expect(labels.map((l) => l.text)).toEqual(['11月', '12月']);
  });
  it('keeps a partial first month that has room', () => {
    const labels = monthLabels({ start: '2026-10-05', end: '2026-12-31' }, 0, 'ja', PITCH);
    expect(labels.map((l) => l.text)).toEqual(['10月', '11月', '12月']);
  });
  it('gives a wide year label room by dropping the month after it', () => {
    // With Monday-first weeks, 2026-01-01 (Thursday) and 2026-02-01 are only 4 columns apart.
    const labels = monthLabels({ start: '2025-10-29', end: '2026-10-28' }, 1, 'ja', PITCH);
    const texts = labels.map((l) => l.text);
    expect(texts).toContain('2026年1月');
    expect(texts).not.toContain('2月');
    for (let i = 1; i < labels.length; i += 1) {
      expect(labels[i].column - labels[i - 1].column).toBeGreaterThanOrEqual(labelColumns(labels[i - 1].text, PITCH));
    }
  });
  it('lets only the partial first month give way, never a later label', () => {
    // A partial December gives way to 2026年1月, which must not then give way to 2月.
    const labels = monthLabels({ start: '2025-12-20', end: '2026-03-31' }, 1, 'ja', PITCH);
    expect(labels.map((l) => l.text)).toEqual(['2026年1月', '3月']);
  });
  it('labels months in years below 1000', () => {
    const labels = monthLabels({ start: '0050-06-01', end: '0050-08-31' }, 0, 'en', PITCH);
    expect(labels.map((l) => l.text)).toEqual(['Jun', 'Jul', 'Aug']);
  });
  it('returns no labels for an empty range', () => {
    expect(monthLabels({ start: '2026-10-29', end: '2026-10-28' }, 0, 'ja', PITCH)).toEqual([]);
  });
  it('labels a single-day range', () => {
    expect(monthLabels({ start: '2026-10-28', end: '2026-10-28' }, 0, 'en', PITCH)).toEqual([
      { column: 0, text: 'Oct' },
    ]);
  });
});

describe('weekdayLabels', () => {
  it('labels Monday, Wednesday and Friday when weeks start on Sunday', () => {
    expect(weekdayLabels('ja', 0)).toEqual(['', '月', '', '水', '', '金', '']);
    expect(weekdayLabels('en', 0)).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
  });
  it('still labels Monday, Wednesday and Friday when weeks start on Monday', () => {
    expect(weekdayLabels('ja', 1)).toEqual(['月', '', '水', '', '金', '', '']);
    expect(weekdayLabels('en', 1)).toEqual(['Mon', '', 'Wed', '', 'Fri', '', '']);
  });
});
