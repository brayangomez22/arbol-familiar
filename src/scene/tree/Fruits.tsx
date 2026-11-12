import { useEffect, useMemo } from 'react';
import { MeshBasicMaterial, PlaneGeometry } from 'three';
import { FRUIT_LABEL, FRUIT_MESH, WIND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import { swayWeight, type TreeReach } from '@/layout/reach';
import type { BranchSegment, FruitPlacement } from '@/layout/types';
import { HaloMaterial } from '../materials/HaloMaterial';
import { ToonMaterial } from '../materials/ToonMaterial';
import { Fruit, type FruitResources } from './Fruit';
import { fruitColorIndex } from './fruitColor';
import { FruitSparks, type SparkSource } from './FruitSparks';
import { labelAlignments } from './labelAlignment';
import { buildLanternBody, buildLanternCap } from './fruitGeometry';

interface FruitsProps {
  readonly fruits: readonly FruitPlacement[];
  readonly branches: readonly BranchSegment[];
  readonly labels: ReadonlyMap<PersonId, string>;
  readonly reach: TreeReach;
}

/** All the people. Geometries are shared, and there is one material per theme fruit color. */
export function Fruits({ fruits, branches, labels, reach }: FruitsProps) {
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
        glowColor: dayPalette.haloGlow,
        glowOpacity: FRUIT_MESH.haloGlow.opacity,
        glowGrowth: FRUIT_MESH.haloGlow.growth,
      }),
      // Names are captions over the picture: always readable, never hidden behind a branch.
      labelMaterial: new MeshBasicMaterial({
        depthTest: false,
        depthWrite: false,
        transparent: true,
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
      shared.labelMaterial.dispose();
    },
    [shared],
  );

  const alignments = useMemo(() => labelAlignments(fruits), [fruits]);
  const generationOf = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.generation])),
    [branches],
  );
  // Each fruit moves with the wind exactly as the tip of its branch does.
  const sources = useMemo(() => {
    const byId = new Map(branches.map((branch) => [branch.id, branch]));
    return new Map(
      fruits.map((fruit): [PersonId, SparkSource] => {
        const tip = byId.get(fruit.anchorBranchId)?.points.at(-1);
        const weight = tip
          ? swayWeight(reach.atFraction(fruit.anchorBranchId, 1), reach.max, WIND.weightExponent)
          : 0;
        return [
          fruit.personId,
          {
            position: fruit.position,
            size: fruit.size,
            swayAnchor: tip ?? fruit.position,
            swayWeight: weight,
          },
        ];
      }),
    );
  }, [fruits, branches, reach]);

  const lanterns = fruits.map((fruit) => {
    const bodyMaterial = shared.bodyMaterials[fruitColorIndex(fruit.personId, dayPalette)];
    const source = sources.get(fruit.personId);
    if (!bodyMaterial || !source) return null;
    const resources: FruitResources = {
      bodyGeometry: shared.body,
      bodyMaterial,
      capGeometry: shared.cap,
      capMaterial: shared.capMaterial,
      haloGeometry: shared.halo,
      haloMaterial: shared.haloMaterial,
      labelMaterial: shared.labelMaterial,
    };
    return (
      <Fruit
        key={fruit.personId}
        fruit={fruit}
        resources={resources}
        label={labels.get(fruit.personId) ?? ''}
        labelAlign={alignments.get(fruit.personId) ?? 'center'}
        swayAnchor={source.swayAnchor}
        swayWeight={source.swayWeight}
        alwaysLabeled={
          (generationOf.get(fruit.anchorBranchId) ?? 0) <= FRUIT_LABEL.alwaysVisibleGenerations
        }
      />
    );
  });

  return (
    <>
      {lanterns}
      <FruitSparks sources={sources} />
    </>
  );
}
