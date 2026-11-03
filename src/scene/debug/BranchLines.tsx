import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { DEBUG_VIEW } from '@/config/constants';
import { sampleCurve } from '@/layout/curve';
import type { BranchSegment } from '@/layout/types';

interface BranchLinesProps {
  readonly branches: readonly BranchSegment[];
  readonly color: string;
}

/** Each branch as its curve, as wide as its average thickness. */
export function BranchLines({ branches, color }: BranchLinesProps) {
  const lines = useMemo(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        points: sampleCurve(branch.points, DEBUG_VIEW.curveSegments).map(
          (p): [number, number, number] => [p.x, p.y, p.z],
        ),
        width: branch.radiusStart + branch.radiusEnd,
      })),
    [branches],
  );

  return lines.map((line) => (
    <Line key={line.id} points={line.points} color={color} lineWidth={line.width} worldUnits />
  ));
}
