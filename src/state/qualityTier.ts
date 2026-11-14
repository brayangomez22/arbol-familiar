import {
  DEFAULT_QUALITY_TIER,
  DEVICE_HINTS,
  QUALITY_TIERS,
  type QualityTier,
} from '@/config/quality';

/** What the browser tells us about the device before a single frame is drawn. */
export interface DeviceHints {
  /** Touch is the main pointer: a phone or a tablet. */
  readonly coarsePointer: boolean;
  readonly cores?: number;
  /** In GB, rounded by the browser (Chromium only). */
  readonly memoryGb?: number;
}

export interface InitialQuality {
  readonly tier: QualityTier;
  /** Forced from the URL (`?quality=low`): the performance monitor leaves it alone. */
  readonly pinned: boolean;
}

/**
 * A first guess, so a modest phone never starts on the heaviest tier and stutters through the
 * intro before the monitor has measured anything. The monitor corrects it either way.
 */
export function initialQualityTier(
  hints: DeviceHints,
  override: QualityTier | null,
): InitialQuality {
  if (override) return { tier: override, pinned: true };
  const weak =
    (hints.cores !== undefined && hints.cores <= DEVICE_HINTS.fewCores) ||
    (hints.memoryGb !== undefined && hints.memoryGb <= DEVICE_HINTS.littleMemory);
  if (hints.coarsePointer) return { tier: weak ? 'low' : 'medium', pinned: false };
  return { tier: weak ? 'medium' : DEFAULT_QUALITY_TIER, pinned: false };
}

/** One tier richer (+1) or cheaper (-1), never past either end. */
export function stepQualityTier(tier: QualityTier, direction: 1 | -1): QualityTier {
  const index = QUALITY_TIERS.indexOf(tier) + direction;
  return QUALITY_TIERS[Math.min(Math.max(index, 0), QUALITY_TIERS.length - 1)] ?? tier;
}

/** `?quality=low|medium|high`, for testing a tier on any device. */
export function readQualityOverride(search: string): QualityTier | null {
  const value = new URLSearchParams(search).get('quality');
  return QUALITY_TIERS.find((tier) => tier === value) ?? null;
}

export function readDeviceHints(): DeviceHints {
  // deviceMemory is not in the DOM typings: it only exists in Chromium.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    ...(navigator.hardwareConcurrency > 0 && { cores: navigator.hardwareConcurrency }),
    ...(memory !== undefined && { memoryGb: memory }),
  };
}
