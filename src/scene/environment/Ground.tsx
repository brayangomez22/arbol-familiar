import { GROUND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { Bounds } from '@/layout/types';

interface GroundProps {
  readonly bounds: Bounds;
}

/** Flat ground at y = 0 that the roots sink into. Phase 3 turns it into a hill. */
export function Ground({ bounds }: GroundProps) {
  const size = (bounds.max.x - bounds.min.x) * GROUND.sizeFactor;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  return (
    <mesh position={[centerX, 0, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={dayPalette.ground} roughness={1} />
    </mesh>
  );
}
