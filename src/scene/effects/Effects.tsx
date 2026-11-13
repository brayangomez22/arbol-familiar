import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing';
import { DepthOfFieldEffect, type BloomEffect } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { POSTPROCESSING, SELECTION } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { useAppStore } from '@/state/store';
import { ambientFrame, livePalette } from '../ambient/livePalette';
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
  const paper = useMemo(() => new PaperEffect(livePalette), []);
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
  const bloomRef = useRef<BloomEffect>(null);
  useFrame(() => {
    const effect = depthOfFieldRef.current;
    if (effect) effect.bokehScale = SELECTION.focus.bokehScale * focusUniforms.uFocus.value;
    // The night turns the bloom up, so the lanterns glow.
    const bloom = bloomRef.current;
    if (bloom) {
      bloom.intensity = ambientFrame.bloomIntensity;
      bloom.luminanceMaterial.threshold = ambientFrame.bloomThreshold;
    }
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
          ref={bloomRef}
          mipmapBlur
          intensity={ambientFrame.bloomIntensity}
          luminanceThreshold={ambientFrame.bloomThreshold}
          luminanceSmoothing={bloom.smoothing}
          radius={bloom.radius}
        />
      )}
      <primitive object={paper} />
    </EffectComposer>
  );
}
