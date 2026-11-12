import type { WIND } from '@/config/constants';
import { createRandom } from '@/layout/random';

export type GustConfig = typeof WIND.gust;

interface Gust {
  readonly start: number;
  readonly duration: number;
  readonly peak: number;
}

/**
 * Gust strength (0–1) as a function of the wind clock. Time is cut into slots, each with at most
 * one gust that fits inside it, so gusts never overlap and the answer for any moment is the same
 * on every visit. Each gust swells and fades with zero slope at both ends and at its peak: the
 * amplitude never jumps.
 */
export function createGustSchedule(config: GustConfig): (time: number) => number {
  let cachedSlot = Number.NaN;
  let cachedGust: Gust | null = null;

  return (time) => {
    const slot = Math.floor(time / config.interval);
    if (slot !== cachedSlot) {
      cachedSlot = slot;
      cachedGust = gustInSlot(slot, config);
    }
    if (!cachedGust) return 0;
    const progress = (time - slot * config.interval - cachedGust.start) / cachedGust.duration;
    return cachedGust.peak * envelope(progress, config.rise);
  };
}

function gustInSlot(slot: number, config: GustConfig): Gust | null {
  const rng = createRandom(config.seed, String(slot));
  if (rng.next() >= config.chance) return null;
  const duration = rng.range(config.minDuration, config.maxDuration);
  return {
    duration,
    start: rng.range(0, config.interval - duration),
    peak: rng.range(config.minPeak, 1),
  };
}

/** 0 → 1 over the first `rise` of the gust, back to 0 over the rest; smoothstep both ways. */
function envelope(progress: number, rise: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return progress < rise ? smoothstep(progress / rise) : smoothstep((1 - progress) / (1 - rise));
}

function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}
