import { useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing';
import { useEffect, useMemo } from 'react';
import { POSTPROCESSING } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { useAppStore } from '@/state/store';
import { PaperEffect } from './PaperEffect';

/** The illustrated finish: paper, vignette and a soft bloom. Skipped on the lowest quality. */
export function Effects() {
  const quality = useAppStore((state) => QUALITY[state.qualityTier]);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const paper = useMemo(() => new PaperEffect(dayPalette), []);
  useEffect(() => {
    paper.setPixelRatio(pixelRatio);
  }, [paper, pixelRatio]);
  useEffect(
    () => () => {
      paper.dispose();
    },
    [paper],
  );

  if (!quality.postprocessing) return null;
  const { bloom } = POSTPROCESSING;
  return (
    // SMAA instead of MSAA: on integrated GPUs, multisampled float targets halved the frame rate.
    // It runs first so it smooths the scene's edges, not the paper grain.
    <EffectComposer multisampling={0}>
      {quality.antialias && <SMAA />}
      {quality.bloom && (
        <Bloom
          mipmapBlur
          intensity={bloom.intensity}
          luminanceThreshold={bloom.threshold}
          luminanceSmoothing={bloom.smoothing}
          radius={bloom.radius}
        />
      )}
      <primitive object={paper} />
    </EffectComposer>
  );
}
