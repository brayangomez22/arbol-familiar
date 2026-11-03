import { useFrame } from '@react-three/fiber';
import { useMemo, type RefObject } from 'react';
import { Vector3 } from 'three';
import type { FruitPlacement } from '@/layout/types';

interface LabelProjectorProps {
  readonly fruits: readonly FruitPlacement[];
  readonly labelRefs: RefObject<(HTMLElement | null)[]>;
}

/** Keeps each DOM name tag centered just under its fruit as the camera moves. */
export function LabelProjector({ fruits, labelRefs }: LabelProjectorProps) {
  const projected = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }) => {
    fruits.forEach((fruit, i) => {
      const label = labelRefs.current[i];
      if (!label) return;
      const { x, y, z } = fruit.position;
      projected.set(x, y - fruit.size, z).project(camera);
      const left = ((projected.x + 1) / 2) * size.width;
      const top = ((1 - projected.y) / 2) * size.height;
      label.style.transform = `translate(${left}px, ${top}px) translate(-50%, 2px)`;
    });
  });

  return null;
}
