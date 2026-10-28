import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, oneYearBefore, toDayNumber } from './date';
import { buildWeeks, countsInRange } from './grid';
import { defaultLevels } from './levels';
import * as main from './index';
import { createSampleData } from './sample';

const END = '2026-10-28';

function levelsShown(end: string, seed: number): Set<number> {
  const data = createSampleData({ end, seed });
  const range = { start: oneYearBefore(end), end };
  const weeks = buildWeeks(data, range, 0, defaultLevels(countsInRange(data, range)));
  return new Set(weeks.flatMap((w) => w.cells.flatMap((c) => (c && !c.missing ? [c.level] : []))));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createSampleData', () => {
  it('gives the same data for the same seed and different data for another seed', () => {
    expect(createSampleData({ end: END, seed: 7 })).toEqual(createSampleData({ end: END, seed: 7 }));
    expect(createSampleData({ end: END, seed: 7 })).not.toEqual(createSampleData({ end: END, seed: 8 }));
  });

  it('covers 365 consecutive days ending on end by default', () => {
    const data = createSampleData({ end: END });
    expect(data).toHaveLength(365);
    expect(data[0].date).toBe('2025-10-29');
    expect(data.at(-1)?.date).toBe(END);
    for (let i = 1; i < data.length; i += 1) {
      expect(toDayNumber(data[i].date) - toDayNumber(data[i - 1].date)).toBe(1);
    }
  });

  it('fills the default one-year range of the calendar exactly, also in a leap year', () => {
    const data = createSampleData({ end: '2024-12-31' });
    expect(data).toHaveLength(366);
    expect(data[0].date).toBe(oneYearBefore('2024-12-31'));
    expect(new Set(data.map((d) => d.date)).size).toBe(data.length);
  });

  it('honors days, and returns nothing for zero or negative days', () => {
    const data = createSampleData({ end: END, days: 30.7 });
    expect(data).toHaveLength(30);
    expect(data[0].date).toBe(addDays(END, -29));
    expect(createSampleData({ end: END, days: 0 })).toEqual([]);
    expect(createSampleData({ end: END, days: -5 })).toEqual([]);
  });

  it('includes zero days, a short missing stretch, and quieter weekends', () => {
    const data = createSampleData({ end: END });
    expect(data.some((d) => d.count === 0 && !d.missing)).toBe(true);
    const missing = data.filter((d) => d.missing);
    expect(missing).toHaveLength(4);
    expect(toDayNumber(missing[3].date) - toDayNumber(missing[0].date)).toBe(3);
    const mean = (list: typeof data) => list.reduce((sum, d) => sum + d.count, 0) / list.length;
    const isWeekend = (d: { date: string }) => [0, 6].includes(new Date(`${d.date}T00:00Z`).getUTCDay());
    expect(mean(data.filter(isWeekend))).toBeLessThan(mean(data.filter((d) => !isWeekend(d))));
  });

  it('shows all five levels with the default levels, for many seeds and end dates', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const end of [END, '2024-02-29', '2027-06-15']) {
        expect(levelsShown(end, seed)).toEqual(new Set([0, 1, 2, 3, 4]));
      }
    }
  });

  it('defaults end to today', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 28, 23, 59));
    expect(createSampleData({ days: 1 })[0].date).toBe('2026-10-28');
  });

  it('rejects an invalid end date', () => {
    expect(() => createSampleData({ end: '2026-02-30' })).toThrow(RangeError);
  });

  it('is not exported from the main entry', () => {
    expect('createSampleData' in main).toBe(false);
  });
});
