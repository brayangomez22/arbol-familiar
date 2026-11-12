import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing';
import { DepthOfFieldEffect } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { POSTPROCESSING, SELECTION } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { useAppStore } from '@/state/store';
import { focusPoint, focusUniforms } from '../selection/focusUniforms';
import { PaperEffect } from './PaperEffect';

/**
 * The illustrated finish: paper, vignette and a soft bloom, plus depth of field on the selected
 * person. Skipped on the lowest quality; the depth of field only runs on the highest.
 */
export function Effects() {
  const quality = useAppStore((state) => QUALITY[state.qualityTier]);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const camera = useThree((state) => state.camera);
  const paper = useMemo(() => new PaperEffect(dayPalette), []);
  const depthOfField = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, {
      focusRange: SELECTION.focus.focusRange,
      bokehScale: 0,
    });
    // Always sharp on the selected fruit, wherever the camera is.
    effect.target = focusPoint;
    return effect;
  }, [camera]);
  useEffect(() => {
    paper.setPixelRatio(pixelRatio);
  }, [paper, pixelRatio]);
  useEffect(
    () => () => {
      paper.dispose();
    },
    [paper],
  );
  useEffect(
    () => () => {
      depthOfField.dispose();
    },
    [depthOfField],
  );

  // The blur follows the same eased focus as the desaturation: one motion, not two.
  const depthOfFieldRef = useRef<DepthOfFieldEffect>(null);
  useFrame(() => {
    const effect = depthOfFieldRef.current;
    if (effect) effect.bokehScale = SELECTION.focus.bokehScale * focusUniforms.uFocus.value;
  });

  if (!quality.postprocessing) return null;
  const { bloom } = POSTPROCESSING;
  return (
    // SMAA instead of MSAA: on integrated GPUs, multisampled float targets halved the frame rate.
    // It runs first so it smooths the scene's edges, not the paper grain.
    <EffectComposer multisampling={0}>
      {quality.antialias && <SMAA />}
      {quality.depthOfField && <primitive ref={depthOfFieldRef} object={depthOfField} />}
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
