import { describe, expect, it } from 'vitest';
import { aggregateDays, buildWeeks, countsInRange, resolveRange, rowOf } from './grid';
import type { Levels } from './levels';

const LEVELS: Levels = [1, 3, 6, 10];

describe('resolveRange', () => {
  it('defaults to the last year ending today', () => {
    expect(resolveRange(undefined, undefined, '2026-10-28')).toEqual({ start: '2025-10-29', end: '2026-10-28' });
  });
  it('keeps given dates and derives a missing start from end', () => {
    expect(resolveRange('2026-01-01', '2026-03-31', '2026-10-28')).toEqual({ start: '2026-01-01', end: '2026-03-31' });
    expect(resolveRange(undefined, '2026-06-30', '2026-10-28')).toEqual({ start: '2025-07-01', end: '2026-06-30' });
    expect(resolveRange('2026-10-01', undefined, '2026-10-28')).toEqual({ start: '2026-10-01', end: '2026-10-28' });
  });
  it('treats invalid dates as missing', () => {
    expect(resolveRange('2026-02-30', 'tomorrow', '2026-10-28')).toEqual({ start: '2025-10-29', end: '2026-10-28' });
  });
});

describe('aggregateDays', () => {
  const range = { start: '2026-10-01', end: '2026-10-31' };
  it('adds up counts on the same date', () => {
    const map = aggregateDays(
      [
        { date: '2026-10-05', count: 2 },
        { date: '2026-10-05', count: 3 },
      ],
      range,
    );
    expect(map.get('2026-10-05')).toEqual({ count: 5, missing: false });
  });
  it('marks a date missing only when every entry is missing', () => {
    const map = aggregateDays(
      [
        { date: '2026-10-05', count: 0, missing: true },
        { date: '2026-10-05', count: 1 },
        { date: '2026-10-06', count: 0, missing: true },
        { date: '2026-10-06', count: 0, missing: true },
      ],
      range,
    );
    expect(map.get('2026-10-05')).toEqual({ count: 1, missing: false });
    expect(map.get('2026-10-06')).toEqual({ count: 0, missing: true });
  });
  it('ignores entries outside the range and with invalid dates', () => {
    const map = aggregateDays(
      [
        { date: '2026-09-30', count: 1 },
        { date: '2026-11-01', count: 1 },
        { date: '2026-10-32', count: 1 },
        { date: '10/05/2026', count: 1 },
        { date: '2026-10-01', count: 1 },
        { date: '2026-10-31', count: 1 },
      ],
      range,
    );
    expect([...map.keys()]).toEqual(['2026-10-01', '2026-10-31']);
  });
  it('treats negative and non-finite counts as 0', () => {
    const map = aggregateDays(
      [
        { date: '2026-10-05', count: -3 },
        { date: '2026-10-06', count: Number.NaN },
        { date: '2026-10-07', count: Number.POSITIVE_INFINITY },
      ],
      range,
    );
    expect([...map.values()].map((v) => v.count)).toEqual([0, 0, 0]);
  });
});

describe('countsInRange', () => {
  it('uses only shown days with data, after adding up the same date', () => {
    const counts = countsInRange(
      [
        { date: '2026-10-05', count: 2 },
        { date: '2026-10-05', count: 3 },
        { date: '2026-10-06', count: 100, missing: true },
        { date: '2026-09-30', count: 500 },
        { date: '2026-10-07', count: 4 },
      ],
      { start: '2026-10-01', end: '2026-10-31' },
    );
    expect(counts).toEqual([5, 4]);
  });
  it('returns nothing for an empty range', () => {
    expect(countsInRange([{ date: '2026-10-05', count: 2 }], { start: '2026-10-06', end: '2026-10-05' })).toEqual([]);
  });
});

describe('rowOf', () => {
  it('counts rows from the first day of the week', () => {
    expect(rowOf('2026-10-25', 0)).toBe(0); // Sunday
    expect(rowOf('2026-10-25', 1)).toBe(6);
    expect(rowOf('2026-10-26', 1)).toBe(0); // Monday
  });
});

describe('buildWeeks', () => {
  it('lays a range out in 7-row columns padded with null', () => {
    // 2026-10-28 is a Wednesday, 2026-11-03 a Tuesday.
    const weeks = buildWeeks([], { start: '2026-10-28', end: '2026-11-03' }, 0, LEVELS);
    expect(weeks.map((w) => w.key)).toEqual(['2026-10-28', '2026-11-01']);
    expect(weeks[0].cells.map((c) => c?.date ?? null)).toEqual([
      null,
      null,
      null,
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(weeks[1].cells.map((c) => c?.date ?? null)).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      null,
      null,
      null,
      null,
    ]);
  });
  it('starts columns on Monday when weekStart is 1', () => {
    const weeks = buildWeeks([], { start: '2026-10-25', end: '2026-10-26' }, 1, LEVELS);
    expect(weeks.map((w) => w.key)).toEqual(['2026-10-25', '2026-10-26']);
    expect(weeks[0].cells[6]?.date).toBe('2026-10-25');
    expect(weeks[1].cells[0]?.date).toBe('2026-10-26');
  });
  it('fills counts, levels and missing flags', () => {
    const weeks = buildWeeks(
      [
        { date: '2026-10-25', count: 4 },
        { date: '2026-10-26', count: 500 },
        { date: '2026-10-27', count: 8, missing: true },
      ],
      { start: '2026-10-25', end: '2026-10-28' },
      0,
      LEVELS,
    );
    expect(weeks[0].cells.slice(0, 4)).toEqual([
      { date: '2026-10-25', count: 4, missing: false, level: 2 },
      { date: '2026-10-26', count: 500, missing: false, level: 4 },
      { date: '2026-10-27', count: 8, missing: true, level: 0 },
      { date: '2026-10-28', count: 0, missing: false, level: 0 },
    ]);
  });
  it('makes a single-day range one column', () => {
    const weeks = buildWeeks([], { start: '2026-10-28', end: '2026-10-28' }, 0, LEVELS);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].cells.filter(Boolean)).toHaveLength(1);
  });
  it('returns no columns when start is after end', () => {
    expect(
      buildWeeks([{ date: '2026-10-28', count: 1 }], { start: '2026-10-29', end: '2026-10-28' }, 0, LEVELS),
    ).toEqual([]);
  });
  it('covers a full year with 53 columns', () => {
    const weeks = buildWeeks([], { start: '2025-10-29', end: '2026-10-28' }, 0, LEVELS);
    expect(weeks).toHaveLength(53);
    expect(weeks.flatMap((w) => w.cells).filter(Boolean)).toHaveLength(365);
  });
  it('pads the last column of a range ending on 9999-12-31 with null', () => {
    // 9999-12-31 is a Friday, so Saturday falls in year 10000.
    const weeks = buildWeeks([], { start: '9999-12-27', end: '9999-12-31' }, 0, LEVELS);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].cells.map((c) => c?.date ?? null)).toEqual([
      null,
      '9999-12-27',
      '9999-12-28',
      '9999-12-29',
      '9999-12-30',
      '9999-12-31',
      null,
    ]);
  });
  it('lays out a range starting on 0000-01-01', () => {
    const weeks = buildWeeks([], { start: '0000-01-01', end: '0000-01-02' }, 0, LEVELS);
    expect(weeks.map((w) => w.key)).toEqual(['0000-01-01', '0000-01-02']);
    expect(weeks[0].cells[6]?.date).toBe('0000-01-01');
  });
  it('crosses a leap day', () => {
    const weeks = buildWeeks([], { start: '2024-02-27', end: '2024-03-02' }, 0, LEVELS);
    expect(weeks.flatMap((w) => w.cells).flatMap((c) => (c ? [c.date] : []))).toEqual([
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
      '2024-03-02',
    ]);
  });
});
