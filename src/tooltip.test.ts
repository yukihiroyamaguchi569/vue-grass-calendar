import { describe, expect, it } from 'vitest';
import { shiftIntoView, tooltipVertical } from './tooltip';

describe('tooltipVertical', () => {
  it('goes above a cell with room and flips below near the top', () => {
    expect(tooltipVertical(300)).toBe('above');
    expect(tooltipVertical(40)).toBe('above');
    expect(tooltipVertical(39)).toBe('below');
    expect(tooltipVertical(-20)).toBe('below');
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
