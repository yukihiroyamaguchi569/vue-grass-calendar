import { describe, expect, it } from 'vitest';
import { defaultLevels, isValidLevels, levelOf, type Levels } from './levels';

const LEVELS: Levels = [1, 3, 6, 10];

describe('levelOf', () => {
  it('gives level 0 to zero, negative and non-numeric counts', () => {
    expect(levelOf(0, LEVELS)).toBe(0);
    expect(levelOf(-5, LEVELS)).toBe(0);
    expect(levelOf(Number.NaN, LEVELS)).toBe(0);
  });
  it('uses each bound as the inclusive start of a level', () => {
    expect(levelOf(1, LEVELS)).toBe(1);
    expect(levelOf(2, LEVELS)).toBe(1);
    expect(levelOf(3, LEVELS)).toBe(2);
    expect(levelOf(5.9, LEVELS)).toBe(2);
    expect(levelOf(6, LEVELS)).toBe(3);
    expect(levelOf(10, LEVELS)).toBe(4);
  });
  it('caps outliers at the last level', () => {
    expect(levelOf(10_000, LEVELS)).toBe(4);
    expect(levelOf(Number.POSITIVE_INFINITY, LEVELS)).toBe(4);
  });
  it('leaves small positive counts at 0 when the first bound is above them', () => {
    expect(levelOf(1, [2, 3, 4, 5])).toBe(0);
  });
});

describe('isValidLevels', () => {
  it('accepts four increasing positive bounds', () => {
    expect(isValidLevels([1, 2, 3, 4])).toBe(true);
    expect(isValidLevels([0.5, 1, 1.5, 2])).toBe(true);
  });
  it.each([
    [[1, 2, 3]],
    [[1, 2, 3, 4, 5]],
    [[1, 1, 2, 3]],
    [[3, 2, 1, 0]],
    [[0, 1, 2, 3]],
    [[1, 2, Number.NaN, 4]],
    [[1, 2, 3, Number.POSITIVE_INFINITY]],
    [[]],
  ])('rejects %j', (levels) => {
    expect(isValidLevels(levels)).toBe(false);
  });
});

describe('defaultLevels', () => {
  it('falls back to 1-4 when there is no positive count', () => {
    expect(defaultLevels([])).toEqual([1, 2, 3, 4]);
    expect(defaultLevels([0, 0, -1, Number.NaN])).toEqual([1, 2, 3, 4]);
  });
  it('splits the range up to the 90th percentile evenly', () => {
    const counts = Array.from({ length: 10 }, (_, i) => (i + 1) * 3); // 3..30, p90 = 27
    expect(defaultLevels(counts)).toEqual([1, 9, 18, 27]);
  });
  it('is not dragged up by a single outlier', () => {
    const counts = [...Array.from({ length: 30 }, () => 6), 1000];
    expect(defaultLevels(counts)).toEqual([1, 2, 4, 6]);
    expect(levelOf(6, defaultLevels(counts))).toBe(4);
  });
  it('always returns valid, strictly increasing levels', () => {
    for (const counts of [[1], [2], [1, 1, 1], [0.1], [3, 3, 3, 3]]) {
      const levels = defaultLevels(counts);
      expect(isValidLevels(levels)).toBe(true);
      expect(levels[0]).toBe(1);
    }
  });
});
