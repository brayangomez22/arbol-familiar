import { useFrame } from '@react-three/fiber';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { DAY_CYCLE, FRUIT_MESH, SEASON_LOOK } from '@/config/constants';
import { dayPhasePalettes, seasonPalettes } from '@/config/theme';
import { DAY_PHASES, phaseWeights } from '@/domain/dayCycle';
import { SEASONS } from '@/domain/seasons';
import { useDayBlend, useSeason } from '@/hooks/useAmbient';
import { damp } from '../damp';
import {
  ambientFrame,
  ambientUniforms,
  blendLivePalette,
  livePalette,
  parsePhase,
  parseSeason,
  type PhaseWeights,
  type SeasonWeights,
} from './livePalette';

/** Below this, a weight still on its way counts as arrived: the palette stops being rewritten. */
const SETTLED = 1e-4;

/**
 * Keeps the scene in the light of the hour and the colors of the season. Targets come from the
 * clock (or the URL); the weights of each phase and season ease toward them, and every frame
 * they still move, the live palette and the ambient uniforms are blended again.
 */
export function AmbientDirector() {
  const blend = useDayBlend();
  const season = useSeason();

  const phases = useMemo(
    () => ({
      dawn: parsePhase(dayPhasePalettes.dawn),
      day: parsePhase(dayPhasePalettes.day),
      dusk: parsePhase(dayPhasePalettes.dusk),
      night: parsePhase(dayPhasePalettes.night),
    }),
    [],
  );
  const seasons = useMemo(
    () => ({
      spring: parseSeason(seasonPalettes.spring),
      summer: parseSeason(seasonPalettes.summer),
      autumn: parseSeason(seasonPalettes.autumn),
      winter: parseSeason(seasonPalettes.winter),
    }),
    [],
  );

  const targetPhases = useMemo(() => phaseWeights(blend), [blend]);
  const targetSeasons = useMemo<SeasonWeights>(
    () => ({ spring: 0, summer: 0, autumn: 0, winter: 0, [season]: 1 }),
    [season],
  );
  const target = useRef({ phases: targetPhases, seasons: targetSeasons });
  useLayoutEffect(() => {
    target.current = { phases: targetPhases, seasons: targetSeasons };
  }, [targetPhases, targetSeasons]);

  const current = useRef<{ phases: PhaseWeights; seasons: SeasonWeights } | null>(null);
  const apply = useCallback(
    (phaseMix: PhaseWeights, seasonMix: SeasonWeights) => {
      blendLivePalette(livePalette, phases, phaseMix, seasons, seasonMix);
      applyAmbientNumbers(phaseMix, seasonMix);
    },
    [phases, seasons],
  );

  // The first picture is already the right one: no fade in from a summer day on load.
  useLayoutEffect(() => {
    if (current.current) return;
    current.current = { phases: { ...targetPhases }, seasons: { ...targetSeasons } };
    apply(current.current.phases, current.current.seasons);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the first targets matter here
  }, [apply]);

  useFrame((_, delta) => {
    const now = current.current;
    if (!now) return;
    const { phases: phaseGoal, seasons: seasonGoal } = target.current;
    const phasesMoved = easeWeights(now.phases, phaseGoal, DAY_PHASES, delta);
    const seasonsMoved = easeWeights(now.seasons, seasonGoal, SEASONS, delta);
    if (phasesMoved || seasonsMoved) apply(now.phases, now.seasons);
  });

  return null;
}

/** Eases each weight toward its goal; false once every one has arrived. */
function easeWeights<K extends string>(
  weights: Record<K, number>,
  goal: Readonly<Record<K, number>>,
  keys: readonly K[],
  delta: number,
): boolean {
  let moving = false;
  for (const key of keys) {
    const to = goal[key];
    if (weights[key] === to) continue;
    const next = damp(weights[key], to, DAY_CYCLE.transitionRate, delta);
    weights[key] = Math.abs(next - to) > SETTLED ? next : to;
    moving = true;
  }
  return moving;
}

/** The numeric side of the look: lantern glow, stars, sun, bloom… weighted like the colors. */
function applyAmbientNumbers(phases: PhaseWeights, seasons: SeasonWeights): void {
  let lantern = 0;
  let fireflies = 0;
  let stars = 0;
  let sunX = 0;
  let sunY = 0;
  let sunStrength = 0;
  let halo = 0;
  let bloomIntensity = 0;
  let bloomThreshold = 0;
  for (const phase of DAY_PHASES) {
    const weight = phases[phase];
    const look = DAY_CYCLE.looks[phase];
    lantern += look.lanternGlow * weight;
    fireflies += look.fireflies * weight;
    stars += look.stars * weight;
    sunX += look.sunPosition[0] * weight;
    sunY += look.sunPosition[1] * weight;
    sunStrength += look.sunStrength * weight;
    halo += look.haloOpacity * weight;
    bloomIntensity += look.bloomIntensity * weight;
    bloomThreshold += look.bloomThreshold * weight;
  }
  let leafDensity = 0;
  let blossomDensity = 0;
  for (const season of SEASONS) {
    leafDensity += SEASON_LOOK[season].leafDensity * seasons[season];
    blossomDensity += SEASON_LOOK[season].blossomDensity * seasons[season];
  }

  ambientUniforms.uLanternGlow.value = lantern;
  ambientUniforms.uMemorialGlow.value = Math.max(FRUIT_MESH.deceasedGlow, lantern);
  ambientUniforms.uFireflies.value = fireflies;
  ambientUniforms.uStars.value = stars;
  ambientUniforms.uSunPosition.value.set(sunX, sunY);
  ambientUniforms.uSunStrength.value = sunStrength;
  ambientUniforms.uHaloOpacity.value = halo;
  ambientUniforms.uLeafDensity.value = leafDensity;
  ambientFrame.bloomIntensity = bloomIntensity;
  ambientFrame.bloomThreshold = bloomThreshold;
  ambientFrame.blossomDensity = blossomDensity;
}
