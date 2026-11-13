import { createRandom } from '@/layout/random';

/**
 * Loudest sample of each of `bars` equal slices, scaled so the loudest bar is 1 and none is
 * shorter than `floor`. Silent audio gives flat bars at the floor.
 */
export function peaksOf(samples: Float32Array, bars: number, floor: number): number[] {
  const peaks: number[] = [];
  const slice = samples.length / bars;
  for (let bar = 0; bar < bars; bar++) {
    let peak = 0;
    const end = Math.min(samples.length, Math.floor((bar + 1) * slice));
    for (let i = Math.floor(bar * slice); i < end; i++)
      peak = Math.max(peak, Math.abs(samples[i] ?? 0));
    peaks.push(peak);
  }
  const loudest = Math.max(...peaks);
  return peaks.map((peak) => (loudest > 0 ? floor + (1 - floor) * (peak / loudest) : floor));
}

/** A speech-like shape shown until the real one is decoded (or if it cannot be). */
export function placeholderPeaks(seed: string, bars: number, floor: number): number[] {
  const random = createRandom(seed, 'waveform');
  let level = random.next();
  return Array.from({ length: bars }, () => {
    // A random walk: neighbors are related, like syllables.
    level = Math.min(1, Math.max(0, level + random.signed() * 0.35));
    return floor + (1 - floor) * level;
  });
}
