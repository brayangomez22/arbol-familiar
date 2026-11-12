import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import type { BufferGeometry, Material, Mesh } from 'three';
import { FRUIT_LABEL, FRUIT_MESH, NAVIGATION } from '@/config/constants';
import type { FruitPlacement } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { damp } from '../damp';
import { FruitLabel } from './FruitLabel';

interface FruitProps {
  readonly fruit: FruitPlacement;
  readonly geometry: BufferGeometry;
  readonly material: Material;
  readonly label: string;
  readonly alwaysLabeled: boolean;
}

/** One person: hover grows it, a click (not a drag) selects it. */
export function Fruit({ fruit, geometry, material, label, alwaysLabeled }: FruitProps) {
  const { personId, position, size } = fruit;
  const mesh = useRef<Mesh>(null);
  const highlighted = useAppStore(
    (state) => state.hoveredPersonId === personId || state.selectedPersonId === personId,
  );
  const hoverPerson = useAppStore((state) => state.hoverPerson);
  const selectPerson = useAppStore((state) => state.selectPerson);

  useFrame((_, delta) => {
    const current = mesh.current;
    if (!current) return;
    const target = size * (highlighted ? FRUIT_MESH.highlightScale : 1);
    current.scale.setScalar(damp(current.scale.x, target, FRUIT_MESH.scaleRate, delta));
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hoverPerson(personId);
  };
  const handleOut = () => {
    // Another fruit may have taken the hover already.
    if (useAppStore.getState().hoveredPersonId === personId) hoverPerson(null);
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > NAVIGATION.clickTolerance) return;
    selectPerson(personId);
  };

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        scale={size}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      />
      <Suspense fallback={null}>
        <FruitLabel
          text={label}
          offsetY={size * FRUIT_MESH.highlightScale + FRUIT_LABEL.gap}
          alwaysVisible={alwaysLabeled}
          highlighted={highlighted}
        />
      </Suspense>
    </group>
  );
}
