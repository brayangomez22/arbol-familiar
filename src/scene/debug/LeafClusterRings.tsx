import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { DEBUG_VIEW } from '@/config/constants';
import type { LeafCluster } from '@/layout/types';

interface LeafClusterRingsProps {
  readonly clusters: readonly LeafCluster[];
  readonly color: string;
}

/** Outline of each foliage zone; denser clusters draw more opaque. */
export function LeafClusterRings({ clusters, color }: LeafClusterRingsProps) {
  const rings = useMemo(
    () =>
      clusters.map((cluster, i) => ({
        key: `${cluster.branchId}-${i}`,
        opacity: cluster.density,
        points: Array.from(
          { length: DEBUG_VIEW.circleSegments + 1 },
          (_, step): [number, number, number] => {
            const angle = (step / DEBUG_VIEW.circleSegments) * Math.PI * 2;
            return [
              cluster.position.x + Math.cos(angle) * cluster.radius,
              cluster.position.y + Math.sin(angle) * cluster.radius,
              cluster.position.z,
            ];
          },
        ),
      })),
    [clusters],
  );

  return rings.map((ring) => (
    <Line
      key={ring.key}
      points={ring.points}
      color={color}
      lineWidth={1}
      transparent
      opacity={ring.opacity}
    />
  ));
}
