/**
 * Lower bounds of levels 1-4. A count of `levels[i]` or more gets level i + 1,
 * so the last value works as a cap: every count at or above it gets the
 * darkest color and a single outlier cannot wash out the rest of the grid.
 */
export type Levels = readonly [number, number, number, number];

export const LEVEL_COUNT = 5;

// Share of the non-zero counts that stays below the cap of the default levels.
const CAP_PERCENTILE = 0.9;

export function isValidLevels(levels: readonly number[]): levels is Levels {
  return (
    levels.length === LEVEL_COUNT - 1 &&
    levels.every((v, i) => Number.isFinite(v) && v > 0 && (i === 0 || v > levels[i - 1]))
  );
}

export function levelOf(count: number, levels: Levels): number {
  if (Number.isNaN(count) || count <= 0) return 0;
  let level = 0;
  for (const bound of levels) {
    if (count >= bound) level += 1;
  }
  return level;
}

/**
 * Levels derived from the data: any count above zero is level 1, and levels
 * 2-4 split the range up to a high percentile evenly, so outliers are capped.
 * Bounds stay at least 1 apart, so with a cap below 4 each count raises the
 * level by one and the top levels may go unused.
 */
export function defaultLevels(counts: readonly number[]): Levels {
  const positive = counts.filter((c) => c > 0 && Number.isFinite(c)).sort((a, b) => a - b);
  const index = Math.ceil(positive.length * CAP_PERCENTILE) - 1;
  const cap = positive.length === 0 ? 1 : positive[Math.max(0, index)];
  const steps = LEVEL_COUNT - 2;
  // Fractional counts below 1 (hours, for example) still start at level 1.
  const bounds = [Math.min(1, positive[0] ?? 1)];
  for (let i = 1; i <= steps; i += 1) {
    bounds.push(Math.max(Math.ceil((cap * i) / steps), bounds[i - 1] + 1));
  }
  const [a, b, c, d] = bounds;
  return [a, b, c, d];
}
