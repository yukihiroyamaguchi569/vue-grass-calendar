import { describe, expect, it } from 'vitest';
import { overflowsTop, shiftIntoView } from './tooltip';

describe('overflowsTop', () => {
  it('is true only when the top edge comes closer than the margin', () => {
    expect(overflowsTop(100)).toBe(false);
    expect(overflowsTop(8)).toBe(false);
    expect(overflowsTop(7.9)).toBe(true);
    expect(overflowsTop(-30)).toBe(true);
  });
});

describe('shiftIntoView', () => {
  it('leaves a tooltip that fits where it is', () => {
    expect(shiftIntoView(100, 300, 1000)).toBe(0);
    expect(shiftIntoView(8, 992, 1000)).toBe(0);
  });
  it('moves a tooltip that sticks out on the left to the right', () => {
    expect(shiftIntoView(-140, 156, 320)).toBe(148);
  });
  it('moves a tooltip that sticks out on the right to the left', () => {
    expect(shiftIntoView(900, 1100, 1000)).toBe(-108);
  });
  it('aligns a tooltip wider than the viewport to the left edge', () => {
    expect(shiftIntoView(50, 450, 300)).toBe(-42);
    expect(shiftIntoView(-50, 450, 300)).toBe(58);
  });
});
