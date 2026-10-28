import { addDays, dayOfWeek } from '../src/date';
import type { GrassDay } from '../src/grid';

// Small deterministic PRNG (mulberry32) so the demo looks the same on every load.
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One year of made-up activity with quiet weekends, a few outliers and a gap with no data. */
export function sampleData(start: string, days: number, seed = 1): GrassDay[] {
  const next = random(seed);
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const weekend = dayOfWeek(date) % 6 === 0;
    const [idleChance, maxCount] = weekend ? [0.6, 4] : [0.2, 12];
    const base = next() >= idleChance ? Math.floor(next() * maxCount) : 0;
    const count = next() < 0.01 ? base * 20 : base;
    return { date, count, missing: i >= 150 && i < 160 };
  });
}
