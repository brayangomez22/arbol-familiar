import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial, SphereGeometry } from 'three';
import { FRUIT_LABEL, FRUIT_MESH } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import type { BranchSegment, FruitKind, FruitPlacement } from '@/layout/types';
import { Fruit } from './Fruit';

interface FruitsProps {
  readonly fruits: readonly FruitPlacement[];
  readonly branches: readonly BranchSegment[];
  readonly labels: ReadonlyMap<PersonId, string>;
}

// Placeholder look until phase 3 gives each person their own color and shape.
const KIND_COLORS: Record<FruitKind, string> = {
  blood: dayPalette.fruits[0] ?? dayPalette.trunk,
  graft: dayPalette.fruits[3] ?? dayPalette.trunk,
};

/** All the people, sharing one geometry and one material per kind. */
export function Fruits({ fruits, branches, labels }: FruitsProps) {
  const geometry = useMemo(
    () => new SphereGeometry(1, FRUIT_MESH.widthSegments, FRUIT_MESH.heightSegments),
    [],
  );
  const materials = useMemo(
    (): Record<FruitKind, MeshStandardMaterial> => ({
      blood: new MeshStandardMaterial({ color: KIND_COLORS.blood, roughness: 0.6 }),
      graft: new MeshStandardMaterial({ color: KIND_COLORS.graft, roughness: 0.6 }),
    }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      materials.blood.dispose();
      materials.graft.dispose();
    },
    [geometry, materials],
  );

  const generationOf = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.generation])),
    [branches],
  );

  return fruits.map((fruit) => (
    <Fruit
      key={fruit.personId}
      fruit={fruit}
      geometry={geometry}
      material={materials[fruit.kind]}
      label={labels.get(fruit.personId) ?? ''}
      alwaysLabeled={
        (generationOf.get(fruit.anchorBranchId) ?? 0) <= FRUIT_LABEL.alwaysVisibleGenerations
      }
    />
  ));
}
