import { Line } from '@react-three/drei';
import type { Bounds } from '@/layout/types';

interface BoundsOutlineProps {
  readonly bounds: Bounds;
  readonly groundColor: string;
  readonly boxColor: string;
}

/** The front face of the bounding box, plus the ground line across it. */
export function BoundsOutline({ bounds, groundColor, boxColor }: BoundsOutlineProps) {
  const { min, max } = bounds;
  return (
    <>
      <Line
        points={[
          [min.x, min.y, 0],
          [max.x, min.y, 0],
          [max.x, max.y, 0],
          [min.x, max.y, 0],
          [min.x, min.y, 0],
        ]}
        color={boxColor}
        lineWidth={1}
        dashed
      />
      <Line
        points={[
          [min.x, 0, 0],
          [max.x, 0, 0],
        ]}
        color={groundColor}
        lineWidth={2}
      />
    </>
  );
}
