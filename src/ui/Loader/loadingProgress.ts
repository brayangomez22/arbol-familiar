import { LOADER } from '@/config/constants';

/** Real milestones of the load; the code milestone is reached by the time anything can ask. */
export interface LoadingMilestones {
  readonly fontsReady: boolean;
  /** From 0 to 1. */
  readonly assetProgress: number;
  readonly sceneReady: boolean;
}

/** How full the loading bar is, from 0 to 1, never less than what it showed before any code ran. */
export function loadingProgress({
  fontsReady,
  assetProgress,
  sceneReady,
}: LoadingMilestones): number {
  const { weights } = LOADER;
  const progress =
    weights.code +
    (fontsReady ? weights.fonts : 0) +
    weights.assets * Math.min(Math.max(assetProgress, 0), 1) +
    (sceneReady ? weights.scene : 0);
  return Math.max(progress, LOADER.initial);
}
