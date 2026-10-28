import { describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, fromDayNumber, isIsoDate, localToday, oneYearBefore, toDayNumber } from './date';

describe('isIsoDate', () => {
  it.each(['2026-10-28', '2024-02-29', '1970-01-01', '2026-12-31'])('accepts %s', (v) => {
    expect(isIsoDate(v)).toBe(true);
  });
  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-1-1',
    '20261028',
    '',
    '2026-10-28T00:00',
    ' 2026-10-28',
  ])('rejects %j', (v) => {
    expect(isIsoDate(v)).toBe(false);
  });
});

describe('day numbers', () => {
  it('round-trips through day numbers', () => {
    expect(toDayNumber('1970-01-01')).toBe(0);
    expect(fromDayNumber(toDayNumber('2026-10-28'))).toBe('2026-10-28');
  });
  it('does not move years below 100 to the 1900s', () => {
    expect(fromDayNumber(toDayNumber('0050-06-15'))).toBe('0050-06-15');
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
  });
  it('throws on an invalid date', () => {
    expect(() => toDayNumber('2026-02-30')).toThrow(RangeError);
  });
  it('adds days across month, year and leap day boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-03-08', 0)).toBe('2026-03-08');
  });
  it('is not shifted by daylight saving time', () => {
    // 2026-03-08 and 2026-11-01 are DST switch days in the US.
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
  });
});

describe('dayOfWeek', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(dayOfWeek('2026-10-25')).toBe(0);
    expect(dayOfWeek('2026-10-28')).toBe(3);
    expect(dayOfWeek('2026-10-31')).toBe(6);
    expect(dayOfWeek('1969-12-31')).toBe(3);
  });
});

describe('oneYearBefore', () => {
  it('starts the day after the same date last year', () => {
    expect(oneYearBefore('2026-10-28')).toBe('2025-10-29');
    expect(oneYearBefore('2027-01-01')).toBe('2026-01-02');
    expect(oneYearBefore('2026-12-31')).toBe('2026-01-01');
  });
  it('keeps years below 100 as they are', () => {
    expect(oneYearBefore('0050-03-01')).toBe('0049-03-02');
    expect(oneYearBefore('0001-01-01')).toBe('0000-01-02');
  });
  it('does not go before year 0', () => {
    expect(oneYearBefore('0000-01-01')).toBe('0000-01-01');
    expect(oneYearBefore('0000-12-31')).toBe('0000-01-01');
  });
  it('handles a leap day end and a range covering one', () => {
    expect(oneYearBefore('2024-02-29')).toBe('2023-03-01');
    expect(oneYearBefore('2025-02-28')).toBe('2024-02-29');
  });
});

describe('localToday', () => {
  it('formats the local date of the given clock', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localToday(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
});
