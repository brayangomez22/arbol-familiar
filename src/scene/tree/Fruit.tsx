import { Outlines } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import type { BufferGeometry, Group, Material } from 'three';
import { FRUIT_LABEL, FRUIT_MESH, NAVIGATION, TOON } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { FruitPlacement } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { damp } from '../damp';
import { FruitLabel } from './FruitLabel';
import type { LabelAlign } from './labelAlignment';

/** Geometries and materials shared by every fruit (owned and disposed by Fruits). */
export interface FruitResources {
  readonly bodyGeometry: BufferGeometry;
  readonly bodyMaterial: Material;
  readonly capGeometry: BufferGeometry;
  readonly capMaterial: Material;
  readonly haloGeometry: BufferGeometry;
  readonly haloMaterial: Material;
  readonly labelMaterial: Material;
}

interface FruitProps {
  readonly fruit: FruitPlacement;
  readonly resources: FruitResources;
  readonly label: string;
  readonly labelAlign: LabelAlign;
  readonly alwaysLabeled: boolean;
}

// The halo is decoration: it must never catch the pointer meant for a fruit behind it.
const ignoreRaycast = () => null;

/** One person as a hanging lantern: hover grows it, a click (not a drag) selects it. */
export function Fruit({ fruit, resources, label, labelAlign, alwaysLabeled }: FruitProps) {
  const { personId, position, size } = fruit;
  const lantern = useRef<Group>(null);
  const highlighted = useAppStore(
    (state) => state.hoveredPersonId === personId || state.selectedPersonId === personId,
  );
  const hoverPerson = useAppStore((state) => state.hoverPerson);
  const selectPerson = useAppStore((state) => state.selectPerson);

  useFrame((_, delta) => {
    const current = lantern.current;
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
      <group
        ref={lantern}
        scale={size}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <mesh
          geometry={resources.haloGeometry}
          material={resources.haloMaterial}
          raycast={ignoreRaycast}
        />
        <mesh geometry={resources.bodyGeometry} material={resources.bodyMaterial}>
          <Outlines
            thickness={TOON.outline.fruitThickness}
            color={dayPalette.outline}
            toneMapped={false}
          />
        </mesh>
        <mesh geometry={resources.capGeometry} material={resources.capMaterial}>
          <Outlines
            thickness={TOON.outline.fruitThickness}
            color={dayPalette.outline}
            toneMapped={false}
          />
        </mesh>
      </group>
      <Suspense fallback={null}>
        <FruitLabel
          text={label}
          offsetY={size * FRUIT_MESH.bottom * FRUIT_MESH.highlightScale + FRUIT_LABEL.gap}
          align={labelAlign}
          insetX={size * FRUIT_LABEL.pairInset}
          material={resources.labelMaterial}
          alwaysVisible={alwaysLabeled}
          highlighted={highlighted}
        />
      </Suspense>
    </group>
  );
}
