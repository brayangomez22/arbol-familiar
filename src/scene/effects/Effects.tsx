import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  type Effect,
} from 'postprocessing';
import { useEffect, useRef } from 'react';
import { HalfFloatType } from 'three';
import { POSTPROCESSING, SELECTION } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { useAppStore } from '@/state/store';
import { ambientFrame, livePalette } from '../ambient/livePalette';
import { focusPoint, focusUniforms } from '../selection/focusUniforms';
import { composerState } from './composerState';
import { PaperEffect } from './PaperEffect';

/** Takes over R3F's own render, and runs before the photo capture (priority 2). */
const COMPOSER_PRIORITY = 1;

interface Chain {
  readonly composer: EffectComposer;
  readonly paper: PaperEffect;
  readonly bloom: BloomEffect | null;
  readonly depthOfField: DepthOfFieldEffect | null;
}

/**
 * The illustrated finish: paper, vignette and a soft bloom, plus depth of field on the selected
 * person. Built straight on `postprocessing` (no React wrapper), so only the effects we use reach
 * the bundle; loaded lazily and only on tiers that have effects at all.
 */
export function Effects() {
  const { antialias, bloom, depthOfField } = useAppStore((state) => QUALITY[state.qualityTier]);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const chain = useRef<Chain | null>(null);

  // One chain per set of effects: an EffectPass disposes its effects, so they are never shared.
  useEffect(() => {
    // SMAA instead of MSAA: on integrated GPUs, multisampled float targets halved the frame rate.
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling: 0 });
    const paper = new PaperEffect(livePalette);
    const bloomEffect = bloom
      ? new BloomEffect({
          mipmapBlur: true,
          intensity: ambientFrame.bloomIntensity,
          luminanceThreshold: ambientFrame.bloomThreshold,
          luminanceSmoothing: POSTPROCESSING.bloom.smoothing,
          radius: POSTPROCESSING.bloom.radius,
        })
      : null;
    const depthOfFieldEffect = depthOfField
      ? new DepthOfFieldEffect(camera, { focusRange: SELECTION.focus.focusRange, bokehScale: 0 })
      : null;
    // Always sharp on the selected fruit, wherever the camera is.
    if (depthOfFieldEffect) depthOfFieldEffect.target = focusPoint;

    // SMAA first, so it smooths the scene's edges and not the paper grain.
    const effects: Effect[] = [
      ...(antialias ? [new SMAAEffect()] : []),
      ...(depthOfFieldEffect ? [depthOfFieldEffect] : []),
      ...(bloomEffect ? [bloomEffect] : []),
      paper,
    ];
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, ...effects));
    chain.current = { composer, paper, bloom: bloomEffect, depthOfField: depthOfFieldEffect };
    composerState.active = true;
    return () => {
      chain.current = null;
      composerState.active = false;
      composer.dispose();
    };
  }, [gl, scene, camera, antialias, bloom, depthOfField]);

  useEffect(() => {
    const current = chain.current;
    if (!current) return;
    current.composer.setSize(size.width, size.height);
    current.paper.setPixelRatio(pixelRatio);
  }, [size, pixelRatio, antialias, bloom, depthOfField]);

  useFrame((_, delta) => {
    const current = chain.current;
    if (!current) return;
    // The blur follows the same eased focus as the desaturation: one motion, not two.
    if (current.depthOfField)
      current.depthOfField.bokehScale = SELECTION.focus.bokehScale * focusUniforms.uFocus.value;
    // The night turns the bloom up, so the lanterns glow.
    if (current.bloom) {
      current.bloom.intensity = ambientFrame.bloomIntensity;
      current.bloom.luminanceMaterial.threshold = ambientFrame.bloomThreshold;
    }
    current.composer.render(delta);
  }, COMPOSER_PRIORITY);

  return null;
}
