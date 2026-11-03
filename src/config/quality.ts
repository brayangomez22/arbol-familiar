export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  /** Min and max device pixel ratio passed to the canvas. */
  readonly dpr: readonly [number, number];
  readonly antialias: boolean;
  readonly shadows: boolean;
  readonly postprocessing: boolean;
  readonly bloom: boolean;
  readonly depthOfField: boolean;
  readonly leavesPerBranch: number;
  readonly particles: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    postprocessing: true,
    bloom: true,
    depthOfField: true,
    leavesPerBranch: 60,
    particles: 400,
  },
  medium: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: false,
    postprocessing: true,
    bloom: true,
    depthOfField: false,
    leavesPerBranch: 35,
    particles: 200,
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    postprocessing: false,
    bloom: false,
    depthOfField: false,
    leavesPerBranch: 15,
    particles: 60,
  },
};

export const DEFAULT_QUALITY_TIER: QualityTier = 'high';
