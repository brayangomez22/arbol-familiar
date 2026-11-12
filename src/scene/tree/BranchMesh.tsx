import { Outlines } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { TOON } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { BranchSegment } from '@/layout/types';
import { ToonMaterial } from '../materials/ToonMaterial';
import { buildBranchGeometry } from './branchGeometry';

interface BranchMeshProps {
  readonly segments: readonly BranchSegment[];
  readonly color: string;
}

/** A set of branches (or roots) as one solid mesh of toon-shaded bark with an ink outline. */
export function BranchMesh({ segments, color }: BranchMeshProps) {
  const geometry = useMemo(() => buildBranchGeometry(segments), [segments]);
  const material = useMemo(
    () => new ToonMaterial({ color, palette: dayPalette, bark: true }),
    [color],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <mesh geometry={geometry} material={material}>
      <Outlines
        thickness={TOON.outline.branchThickness}
        color={dayPalette.outline}
        toneMapped={false}
      />
    </mesh>
  );
}
