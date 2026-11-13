import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3, type Object3D } from 'three';
import { SIGNATURE } from '@/config/constants';
import type { BranchSegment } from '@/layout/types';
import { signaturePlacement } from '@/layout/signature';
import { useAppStore } from '@/state/store';
import { livePalette } from '../ambient/livePalette';
import { damp } from '../damp';
import { labelFontUrl } from './labelFont';

/** The part of troika's Text mesh we animate; drei types its ref loosely. */
interface FadingText extends Object3D {
  fillOpacity: number;
  /** Troika supports it; drei's Text props just do not list it. */
  curveRadius: number;
  sync: () => void;
}

interface BarkSignatureProps {
  readonly trunk: BranchSegment;
}

/**
 * "Hecho con amor por Brayan, 2026", carved in the bark in its shadow color. Nobody is told: it
 * only surfaces when the camera is all the way in on that stretch of trunk.
 */
export function BarkSignature({ trunk }: BarkSignatureProps) {
  const placement = useMemo(() => signaturePlacement(trunk, SIGNATURE.at, SIGNATURE.lift), [trunk]);
  const position = useMemo(
    () => new Vector3(placement.position.x, placement.position.y, placement.position.z),
    [placement],
  );
  const text = useRef<FadingText>(null);
  const opacity = useRef(0);

  // Wrapped around the trunk rather than floating flat in front of it.
  useEffect(() => {
    const mesh = text.current;
    if (!mesh) return;
    mesh.curveRadius = -placement.radius;
    mesh.sync();
  }, [placement]);

  useFrame(({ camera }, delta) => {
    const mesh = text.current;
    if (!mesh) return;
    const { introPhase, photoMode } = useAppStore.getState();
    // The intro's camera dives toward the seed at the trunk's foot: not the moment to show it.
    // In photo mode it stays as it was, so a close-up picture can keep it.
    const reveal =
      introPhase === 'done'
        ? closeness(camera.position.distanceTo(position)) * SIGNATURE.opacity
        : 0;
    if (!photoMode) opacity.current = damp(opacity.current, reveal, SIGNATURE.fadeRate, delta);
    mesh.fillOpacity = opacity.current;
    mesh.visible = opacity.current > 0.005;
  });

  return (
    <Text
      ref={text}
      position={position}
      font={labelFontUrl}
      fontSize={SIGNATURE.fontSize}
      lineHeight={SIGNATURE.lineHeight}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      color={livePalette.trunkShadow}
      fillOpacity={0}
    >
      {SIGNATURE.lines.join('\n')}
    </Text>
  );
}

/** 0 until the camera comes within `revealStart`, 1 from `revealEnd` in, smooth between. */
function closeness(distance: number): number {
  const t = (SIGNATURE.revealStart - distance) / (SIGNATURE.revealStart - SIGNATURE.revealEnd);
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}
