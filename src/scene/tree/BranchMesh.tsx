import { useEffect, useMemo } from 'react';
import type { BranchSegment } from '@/layout/types';
import { buildBranchGeometry } from './branchGeometry';

interface BranchMeshProps {
  readonly segments: readonly BranchSegment[];
  readonly color: string;
}

/** A set of branches (or roots) as one solid mesh. */
export function BranchMesh({ segments, color }: BranchMeshProps) {
  const geometry = useMemo(() => buildBranchGeometry(segments), [segments]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}
