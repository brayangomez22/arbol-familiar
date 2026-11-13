import { useEffect, useMemo } from 'react';
import { MeshBasicMaterial, PlaneGeometry } from 'three';
import { FRUIT_LABEL, FRUIT_MESH, INTRO, WIND } from '@/config/constants';
import type { Lifeline } from '@/domain/timeline';
import type { PersonId } from '@/domain/types';
import type { GrowthSchedule } from '@/layout/growth';
import { swayWeight, type TreeReach } from '@/layout/reach';
import type { TimelineSchedule } from '@/layout/timelineGrowth';
import type { BranchSegment, FruitPlacement } from '@/layout/types';
import { ambientUniforms, livePalette } from '../ambient/livePalette';
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
  /** Fruits pop when the growth reaches their branch tip, in the intro and on the timeline. */
  readonly schedule: GrowthSchedule;
  readonly timeline: TimelineSchedule;
  readonly lives: ReadonlyMap<PersonId, Lifeline>;
}

/** All the people. Geometries are shared, and there is one material per theme fruit color. */
export function Fruits({
  fruits,
  branches,
  labels,
  reach,
  schedule,
  timeline,
  lives,
}: FruitsProps) {
  const shared = useMemo(
    () => ({
      body: buildLanternBody(),
      cap: buildLanternCap(),
      halo: new PlaneGeometry(FRUIT_MESH.haloSize, FRUIT_MESH.haloSize),
      // They light up as lanterns at night.
      bodyMaterials: livePalette.fruits.map(
        (color) =>
          new ToonMaterial({
            color,
            palette: livePalette,
            focus: true,
            glow: ambientUniforms.uLanternGlow,
          }),
      ),
      // Those who have passed: a soft gold that glows faintly from within.
      deceasedMaterial: new ToonMaterial({
        color: livePalette.deceasedFruit,
        palette: livePalette,
        focus: true,
        glow: ambientUniforms.uMemorialGlow,
      }),
      capMaterial: new ToonMaterial({
        color: livePalette.trunk,
        palette: livePalette,
        focus: true,
      }),
      haloMaterial: new HaloMaterial({
        color: livePalette.halo,
        opacity: ambientUniforms.uHaloOpacity,
        depthOffset: FRUIT_MESH.haloDepthOffset,
        glowColor: livePalette.haloGlow,
        glowOpacity: FRUIT_MESH.haloGlow.opacity,
        glowGrowth: FRUIT_MESH.haloGlow.growth,
      }),
      // Names are captions over the picture: always readable, never hidden behind a branch.
      // They still write depth where there is ink, so the depth of field doesn't blur them.
      labelMaterial: new MeshBasicMaterial({
        depthTest: false,
        depthWrite: true,
        transparent: true,
        alphaTest: FRUIT_LABEL.depthAlphaTest,
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
      shared.deceasedMaterial.dispose();
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
    const bodyMaterial =
      shared.bodyMaterials[fruitColorIndex(fruit.personId, shared.bodyMaterials.length)];
    const source = sources.get(fruit.personId);
    if (!bodyMaterial || !source) return null;
    const resources: FruitResources = {
      bodyGeometry: shared.body,
      bodyMaterial,
      deceasedMaterial: shared.deceasedMaterial,
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
        bornAt={
          schedule.atFraction(fruit.anchorBranchId, 1) +
          (fruit.kind === 'graft' ? INTRO.fruit.graftDelay : INTRO.fruit.delay)
        }
        lifeline={lives.get(fruit.personId)}
        appearYear={Math.max(
          lives.get(fruit.personId)?.appearYear ?? -Infinity,
          timeline.atFraction(fruit.anchorBranchId, 1),
        )}
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
