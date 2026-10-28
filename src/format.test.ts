import { describe, expect, it } from 'vitest';
import { describeCell, formatCount, formatDate } from './format';

describe('formatDate', () => {
  it('formats in Japanese and English', () => {
    expect(formatDate('2026-01-05', 'ja')).toBe('2026年1月5日');
    expect(formatDate('2026-12-31', 'en')).toBe('Dec 31, 2026');
  });
});

describe('formatCount', () => {
  it('adds a unit in Japanese', () => {
    expect(formatCount(0, 'ja')).toBe('0 件');
    expect(formatCount(1234, 'ja')).toBe('1,234 件');
  });
  it('uses the singular only for exactly one in English', () => {
    expect(formatCount(1, 'en')).toBe('1 contribution');
    expect(formatCount(0, 'en')).toBe('0 contributions');
    expect(formatCount(2, 'en')).toBe('2 contributions');
    expect(formatCount(1234, 'en')).toBe('1,234 contributions');
  });
});

describe('describeCell', () => {
  const cell = { date: '2026-10-28', count: 1234, missing: false, level: 4 };
  it('shows the date and the count with a unit', () => {
    expect(describeCell(cell, 'ja')).toBe('2026年10月28日: 1,234 件');
    expect(describeCell(cell, 'en')).toBe('Oct 28, 2026: 1,234 contributions');
    expect(describeCell({ ...cell, count: 0, level: 0 }, 'en')).toBe('Oct 28, 2026: 0 contributions');
  });
  it('uses the given count text instead of the default', () => {
    expect(describeCell(cell, 'ja', (n) => `${n} 回`)).toBe('2026年10月28日: 1234 回');
  });
  it('says there is no data for a missing day', () => {
    expect(describeCell({ ...cell, missing: true, level: 0 }, 'ja')).toBe('2026年10月28日: 記録なし');
    expect(describeCell({ ...cell, missing: true, level: 0 }, 'ja', (n) => `${n} 回`)).toBe('2026年10月28日: 記録なし');
    expect(describeCell({ ...cell, missing: true, level: 0 }, 'en')).toBe('Oct 28, 2026: no data');
  });
});
