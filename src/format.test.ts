import { describe, expect, it } from 'vitest';
import { describeCell, formatDate } from './format';

describe('formatDate', () => {
  it('formats in Japanese and English', () => {
    expect(formatDate('2026-01-05', 'ja')).toBe('2026年1月5日');
    expect(formatDate('2026-12-31', 'en')).toBe('Dec 31, 2026');
  });
});

describe('describeCell', () => {
  const cell = { date: '2026-10-28', count: 1234, missing: false, level: 4 };
  it('shows the date and the count', () => {
    expect(describeCell(cell, 'ja')).toBe('2026年10月28日: 1,234');
    expect(describeCell(cell, 'en')).toBe('Oct 28, 2026: 1,234');
    expect(describeCell({ ...cell, count: 0, level: 0 }, 'en')).toBe('Oct 28, 2026: 0');
  });
  it('says there is no data for a missing day', () => {
    expect(describeCell({ ...cell, missing: true, level: 0 }, 'ja')).toBe('2026年10月28日: 記録なし');
    expect(describeCell({ ...cell, missing: true, level: 0 }, 'en')).toBe('Oct 28, 2026: no data');
  });
});
