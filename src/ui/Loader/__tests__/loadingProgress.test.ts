import { describe, expect, it } from 'vitest';
import { LOADER } from '@/config/constants';
import { loadingProgress } from '../loadingProgress';

describe('loadingProgress', () => {
  it('starts from the code already running', () => {
    expect(loadingProgress({ fontsReady: false, assetProgress: 0, sceneReady: false })).toBe(
      LOADER.weights.code,
    );
  });

  it('fills completely once every milestone is reached', () => {
    expect(loadingProgress({ fontsReady: true, assetProgress: 1, sceneReady: true })).toBeCloseTo(
      1,
    );
  });

  it('grows with each milestone and clamps the asset share', () => {
    const fonts = loadingProgress({ fontsReady: true, assetProgress: 0, sceneReady: false });
    const assets = loadingProgress({ fontsReady: true, assetProgress: 0.5, sceneReady: false });
    const overflow = loadingProgress({ fontsReady: true, assetProgress: 7, sceneReady: false });
    expect(assets).toBeGreaterThan(fonts);
    expect(overflow).toBeCloseTo(fonts + LOADER.weights.assets);
  });

  it('has weights that add up to the whole bar', () => {
    const total = Object.values(LOADER.weights).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1);
  });
});
