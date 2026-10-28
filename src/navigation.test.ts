import { describe, expect, it } from 'vitest';
import { focusDate, moveDate } from './navigation';

const RANGE = { start: '2026-10-01', end: '2026-10-31' };

describe('moveDate', () => {
  it('moves a day with up and down and a week with left and right', () => {
    expect(moveDate('2026-10-15', 'ArrowUp', RANGE)).toBe('2026-10-14');
    expect(moveDate('2026-10-15', 'ArrowDown', RANGE)).toBe('2026-10-16');
    expect(moveDate('2026-10-15', 'ArrowLeft', RANGE)).toBe('2026-10-08');
    expect(moveDate('2026-10-15', 'ArrowRight', RANGE)).toBe('2026-10-22');
  });
  it('reaches the first and last day of the range', () => {
    expect(moveDate('2026-10-02', 'ArrowUp', RANGE)).toBe('2026-10-01');
    expect(moveDate('2026-10-24', 'ArrowRight', RANGE)).toBe('2026-10-31');
  });
  it('returns null when the move would leave the range', () => {
    expect(moveDate('2026-10-01', 'ArrowUp', RANGE)).toBeNull();
    expect(moveDate('2026-10-31', 'ArrowDown', RANGE)).toBeNull();
    expect(moveDate('2026-10-05', 'ArrowLeft', RANGE)).toBeNull();
    expect(moveDate('2026-10-25', 'ArrowRight', RANGE)).toBeNull();
  });
  it('returns null for keys that are not arrows', () => {
    for (const key of ['Enter', ' ', 'Tab', 'a', 'Home', 'constructor', 'toString']) {
      expect(moveDate('2026-10-15', key, RANGE)).toBeNull();
    }
  });
});

describe('focusDate', () => {
  it('uses the selected date when it is in the range', () => {
    expect(focusDate('2026-10-10', RANGE)).toBe('2026-10-10');
    expect(focusDate('2026-10-01', RANGE)).toBe('2026-10-01');
  });
  it('falls back to the last day otherwise', () => {
    expect(focusDate(null, RANGE)).toBe('2026-10-31');
    expect(focusDate(undefined, RANGE)).toBe('2026-10-31');
    expect(focusDate('2026-11-01', RANGE)).toBe('2026-10-31');
    expect(focusDate('', RANGE)).toBe('2026-10-31');
  });
});
