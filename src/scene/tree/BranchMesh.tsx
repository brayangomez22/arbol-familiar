import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector2 } from 'three';
import { TOON } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { BranchSegment } from '@/layout/types';
import { OutlineMaterial } from '../materials/OutlineMaterial';
import { ToonMaterial } from '../materials/ToonMaterial';
import { buildBranchGeometry, type SwayAt } from './branchGeometry';

interface BranchMeshProps {
  readonly segments: readonly BranchSegment[];
  readonly color: string;
  /** Wind weight along each segment; without it the wood stays still. */
  readonly swayAt?: SwayAt;
}

/** A set of branches (or roots) as one solid mesh of toon-shaded bark with an ink outline. */
export function BranchMesh({ segments, color, swayAt }: BranchMeshProps) {
  const geometry = useMemo(() => buildBranchGeometry(segments, swayAt), [segments, swayAt]);
  const material = useMemo(
    () => new ToonMaterial({ color, palette: dayPalette, bark: true, wind: true }),
    [color],
  );
  const outline = useMemo(
    () =>
      new OutlineMaterial({
        color: dayPalette.outline,
        thickness: TOON.outline.branchThickness,
        wind: true,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  useEffect(
    () => () => {
      outline.dispose();
    },
    [outline],
  );

  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  useEffect(() => {
    const buffer = gl.getDrawingBufferSize(new Vector2());
    outline.setResolution(buffer.x, buffer.y);
  }, [gl, outline, size, pixelRatio]);

  return (
    <>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={geometry} material={outline} />
    </>
  );
}
