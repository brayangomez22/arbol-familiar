export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  /** Min and max device pixel ratio passed to the canvas. */
  readonly dpr: readonly [number, number];
  readonly antialias: boolean;
  readonly postprocessing: boolean;
  readonly bloom: boolean;
  readonly depthOfField: boolean;
  /** Leaves in a full cluster; sparser clusters get proportionally fewer. */
  readonly leavesPerCluster: number;
  readonly particles: number;
  /** Leaves that can be falling from the crown at the same time. */
  readonly fallingLeaves: number;
  readonly grassBlades: number;
  readonly cloudPuffSegments: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 2],
    antialias: true,
    postprocessing: true,
    bloom: true,
    depthOfField: true,
    leavesPerCluster: 110,
    particles: 400,
    fallingLeaves: 4,
    grassBlades: 1400,
    cloudPuffSegments: 40,
  },
  medium: {
    dpr: [1, 1.5],
    antialias: true,
    postprocessing: true,
    bloom: true,
    depthOfField: false,
    leavesPerCluster: 70,
    particles: 200,
    fallingLeaves: 3,
    grassBlades: 800,
    cloudPuffSegments: 28,
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    postprocessing: false,
    bloom: false,
    depthOfField: false,
    leavesPerCluster: 35,
    particles: 60,
    fallingLeaves: 1,
    grassBlades: 300,
    cloudPuffSegments: 18,
  },
};

/** From cheapest to richest: the monitor steps along this list one tier at a time. */
export const QUALITY_TIERS: readonly QualityTier[] = ['low', 'medium', 'high'];

/** Where a visit starts before any frame is measured (see state/qualityTier.ts). */
export const DEFAULT_QUALITY_TIER: QualityTier = 'high';

/** What the device says about itself, read once at load. */
export const DEVICE_HINTS = {
  /** At or below this many logical cores, a phone starts on low and a desktop on medium. */
  fewCores: 4,
  /** At or below this many GB (navigator.deviceMemory), the same. */
  littleMemory: 4,
} as const;

/**
 * drei's PerformanceMonitor: frame rate sampled every `sampleMs`, judged every `iterations`
 * samples. Below `minFps` the tier steps down; above `upperFps` (or `upperFpsFast` on screens
 * faster than `fastRefreshRate`) it may step back up. After `flipflops` changes it settles.
 */
export const QUALITY_MONITOR = {
  minFps: 45,
  upperFps: 57,
  upperFpsFast: 100,
  fastRefreshRate: 100,
  sampleMs: 250,
  iterations: 10,
  threshold: 0.75,
  flipflops: 3,
} as const;
