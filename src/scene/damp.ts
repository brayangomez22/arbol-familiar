/**
 * Frame-rate independent easing of `current` toward `target`: the same feel at 30 or 144 fps.
 * `rate` is in 1/s; higher catches up faster.
 */
export function damp(current: number, target: number, rate: number, delta: number): number {
  return target + (current - target) * Math.exp(-rate * delta);
}
