import { describe, expect, it } from 'vitest';
import { chooseVertical, shiftIntoView } from './tooltip';

describe('chooseVertical', () => {
  const cell = (top: number) => ({ top, bottom: top + 11 });
  it('goes above when the tooltip fits there', () => {
    expect(chooseVertical(cell(300), 30, 800)).toBe('above');
    expect(chooseVertical(cell(44), 30, 800)).toBe('above'); // 44 - 6 - 8 = 30
  });
  it('flips below when it does not fit above but fits below', () => {
    expect(chooseVertical(cell(43), 30, 800)).toBe('below');
    expect(chooseVertical(cell(50), 80, 800)).toBe('below');
  });
  it('takes the side with more room when it fits on neither', () => {
    expect(chooseVertical(cell(100), 300, 300)).toBe('below'); // room above 86, below 175
    expect(chooseVertical(cell(200), 300, 300)).toBe('above'); // room above 186, below 75
    expect(chooseVertical(cell(150), 500, 311)).toBe('above'); // 136 px on both sides: keep above
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
