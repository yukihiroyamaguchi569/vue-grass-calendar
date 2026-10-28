import { describe, expect, it } from 'vitest';
import { tooltipPlacement } from './tooltip';

const cellAt = (left: number, top: number) => ({ left, right: left + 11, top, bottom: top + 11 });

describe('tooltipPlacement', () => {
  it('centers the tooltip above a cell with room around it', () => {
    expect(tooltipPlacement(cellAt(500, 300), 1000)).toEqual({ vertical: 'above', horizontal: 'center' });
  });
  it('flips below a cell near the top of the viewport', () => {
    expect(tooltipPlacement(cellAt(500, 39), 1000).vertical).toBe('below');
    expect(tooltipPlacement(cellAt(500, 40), 1000).vertical).toBe('above');
    expect(tooltipPlacement(cellAt(500, -20), 1000).vertical).toBe('below');
  });
  it('shifts toward the inside near the left and right edges', () => {
    expect(tooltipPlacement(cellAt(10, 300), 1000).horizontal).toBe('start');
    expect(tooltipPlacement(cellAt(970, 300), 1000).horizontal).toBe('end');
    expect(tooltipPlacement(cellAt(114.5, 300), 1000).horizontal).toBe('center');
  });
  it('prefers start when the viewport is too narrow for either side', () => {
    expect(tooltipPlacement(cellAt(100, 300), 150).horizontal).toBe('start');
  });
});
