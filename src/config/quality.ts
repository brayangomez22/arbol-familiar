export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  /** Min and max device pixel ratio passed to the canvas. */
  readonly dpr: readonly [number, number];
  readonly antialias: boolean;
  readonly shadows: boolean;
  readonly postprocessing: boolean;
  readonly bloom: boolean;
  readonly depthOfField: boolean;
  /** Leaves in a full cluster; sparser clusters get proportionally fewer. */
  readonly leavesPerCluster: number;
  readonly particles: number;
  readonly grassBlades: number;
  readonly cloudPuffSegments: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    postprocessing: true,
    bloom: true,
    depthOfField: true,
    leavesPerCluster: 110,
    particles: 400,
    grassBlades: 1400,
    cloudPuffSegments: 40,
  },
  medium: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: false,
    postprocessing: true,
    bloom: true,
    depthOfField: false,
    leavesPerCluster: 70,
    particles: 200,
    grassBlades: 800,
    cloudPuffSegments: 28,
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    postprocessing: false,
    bloom: false,
    depthOfField: false,
    leavesPerCluster: 35,
    particles: 60,
    grassBlades: 300,
    cloudPuffSegments: 18,
  },
};

export const DEFAULT_QUALITY_TIER: QualityTier = 'high';
