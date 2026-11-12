import { useEffect, useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { FRUIT_LABEL, FRUIT_MESH } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import type { BranchSegment, FruitPlacement } from '@/layout/types';
import { HaloMaterial } from '../materials/HaloMaterial';
import { ToonMaterial } from '../materials/ToonMaterial';
import { Fruit, type FruitResources } from './Fruit';
import { fruitColorIndex } from './fruitColor';
import { buildLanternBody, buildLanternCap } from './fruitGeometry';

interface FruitsProps {
  readonly fruits: readonly FruitPlacement[];
  readonly branches: readonly BranchSegment[];
  readonly labels: ReadonlyMap<PersonId, string>;
}

/** All the people. Geometries are shared, and there is one material per theme fruit color. */
export function Fruits({ fruits, branches, labels }: FruitsProps) {
  const shared = useMemo(
    () => ({
      body: buildLanternBody(),
      cap: buildLanternCap(),
      halo: new PlaneGeometry(FRUIT_MESH.haloSize, FRUIT_MESH.haloSize),
      bodyMaterials: dayPalette.fruits.map(
        (color) => new ToonMaterial({ color, palette: dayPalette }),
      ),
      capMaterial: new ToonMaterial({ color: dayPalette.trunk, palette: dayPalette }),
      haloMaterial: new HaloMaterial({
        color: dayPalette.halo,
        opacity: FRUIT_MESH.haloOpacity,
        depthOffset: FRUIT_MESH.haloDepthOffset,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      shared.body.dispose();
      shared.cap.dispose();
      shared.halo.dispose();
      for (const material of shared.bodyMaterials) material.dispose();
      shared.capMaterial.dispose();
      shared.haloMaterial.dispose();
    },
    [shared],
  );

  const generationOf = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.generation])),
    [branches],
  );

  return fruits.map((fruit) => {
    const bodyMaterial = shared.bodyMaterials[fruitColorIndex(fruit.personId, dayPalette)];
    if (!bodyMaterial) return null;
    const resources: FruitResources = {
      bodyGeometry: shared.body,
      bodyMaterial,
      capGeometry: shared.cap,
      capMaterial: shared.capMaterial,
      haloGeometry: shared.halo,
      haloMaterial: shared.haloMaterial,
    };
    return (
      <Fruit
        key={fruit.personId}
        fruit={fruit}
        resources={resources}
        label={labels.get(fruit.personId) ?? ''}
        alwaysLabeled={
          (generationOf.get(fruit.anchorBranchId) ?? 0) <= FRUIT_LABEL.alwaysVisibleGenerations
        }
      />
    );
  });
}
