import { Color, Vector2 } from 'three';
import { DAY_CYCLE, FRUIT_MESH, SEASON_LOOK } from '@/config/constants';
import {
  dayPalette,
  seasonPalettes,
  type FoliageColors,
  type Palette,
  type SeasonPalette,
} from '@/config/theme';
import { DAY_PHASES, type DayPhase } from '@/domain/dayCycle';
import { SEASONS, type Season } from '@/domain/seasons';

/** Every single color of a Palette. */
type ColorKey = {
  [K in keyof Palette]: Palette[K] extends string ? K : never;
}[keyof Palette];

const COLOR_KEYS = (Object.keys(dayPalette) as (keyof Palette)[]).filter(
  (key): key is ColorKey => typeof dayPalette[key] === 'string',
);

/**
 * The palette the scene is drawn with right now, as three Colors. Materials hold these very
 * objects as uniform values (never copies), so the AmbientDirector rewriting them in place each
 * frame recolors the whole scene at once.
 */
export interface LivePalette extends Readonly<Record<ColorKey, Color>> {
  readonly sky: { readonly top: Color; readonly horizon: Color };
  readonly fruits: readonly Color[];
  readonly leaves: readonly Color[];
  readonly grass: readonly Color[];
  readonly blossom: Color;
  readonly blossomHeart: Color;
}

function createLivePalette(palette: Palette, season: SeasonPalette): LivePalette {
  const colors = Object.fromEntries(
    COLOR_KEYS.map((key) => [key, new Color(palette[key])]),
  ) as Record<ColorKey, Color>;
  return {
    ...colors,
    sky: { top: new Color(palette.sky.top), horizon: new Color(palette.sky.horizon) },
    fruits: palette.fruits.map((hex) => new Color(hex)),
    leaves: season.leaves.map((hex) => new Color(hex)),
    grass: season.grass.map((hex) => new Color(hex)),
    blossom: new Color(season.blossom),
    blossomHeart: new Color(season.blossomHeart),
  };
}

export const livePalette: LivePalette = createLivePalette(dayPalette, seasonPalettes.summer);

/**
 * Numbers that change with the hour and the season, shared by reference like the colors. Starts
 * as a summer day.
 */
type NumberUniform =
  | 'uLanternGlow'
  | 'uMemorialGlow'
  | 'uHaloOpacity'
  | 'uLeafDensity'
  | 'uBlossomDensity'
  | 'uFireflies'
  | 'uStars'
  | 'uSunStrength';

export const ambientUniforms: Readonly<Record<NumberUniform, { value: number }>> & {
  readonly uSunPosition: { value: Vector2 };
} = {
  /** Light of their own on the living people's fruits: lanterns at night. */
  uLanternGlow: { value: 0 },
  /** The deceased fruits' faint glow, which the night brightens too. */
  uMemorialGlow: { value: FRUIT_MESH.deceasedGlow },
  uHaloOpacity: { value: DAY_CYCLE.looks.day.haloOpacity },
  uLeafDensity: { value: SEASON_LOOK.summer.leafDensity },
  /** Share of the crown's spring flowers that are open. */
  uBlossomDensity: { value: SEASON_LOOK.summer.blossomDensity },
  uFireflies: { value: 0 },
  uStars: { value: 0 },
  uSunPosition: { value: new Vector2(...DAY_CYCLE.looks.day.sunPosition) },
  uSunStrength: { value: DAY_CYCLE.looks.day.sunStrength },
};

/** What JS (not shaders) reads from the current ambient: postprocessing and particle counts. */
export const ambientFrame: { bloomIntensity: number; bloomThreshold: number } = {
  bloomIntensity: DAY_CYCLE.looks.day.bloomIntensity,
  bloomThreshold: DAY_CYCLE.looks.day.bloomThreshold,
};

/** Each palette as Colors, built once, so blending allocates nothing per frame. */
interface ParsedPhase {
  readonly colors: Readonly<Record<ColorKey, Color>>;
  readonly skyTop: Color;
  readonly skyHorizon: Color;
  readonly fruits: readonly Color[];
}

export interface ParsedSeason {
  readonly leaves: readonly Color[];
  readonly grass: readonly Color[];
  readonly blossom: Color;
  readonly blossomHeart: Color;
  readonly chill: Color;
}

export function parsePhase(palette: Palette): ParsedPhase {
  return {
    colors: Object.fromEntries(COLOR_KEYS.map((key) => [key, new Color(palette[key])])) as Record<
      ColorKey,
      Color
    >,
    skyTop: new Color(palette.sky.top),
    skyHorizon: new Color(palette.sky.horizon),
    fruits: palette.fruits.map((hex) => new Color(hex)),
  };
}

export function parseSeason(palette: SeasonPalette): ParsedSeason {
  const parse = (colors: FoliageColors) => colors.map((hex) => new Color(hex));
  return {
    leaves: parse(palette.leaves),
    grass: parse(palette.grass),
    blossom: new Color(palette.blossom),
    blossomHeart: new Color(palette.blossomHeart),
    chill: new Color(palette.chill),
  };
}

export type PhaseWeights = Record<DayPhase, number>;
export type SeasonWeights = Record<Season, number>;

const scratch = new Color();

/**
 * Writes into `live` the weighted mix of the phase palettes and season palettes. Weights of each
 * kind add up to 1. Leaves and grass take the season's tone and then lean toward the hour's
 * foliage shade; sky and hills lean toward the season's chill.
 */
export function blendLivePalette(
  live: LivePalette,
  phases: Readonly<Record<DayPhase, ParsedPhase>>,
  phaseWeights: Readonly<PhaseWeights>,
  seasons: Readonly<Record<Season, ParsedSeason>>,
  seasonWeights: Readonly<SeasonWeights>,
): void {
  for (const key of COLOR_KEYS) live[key].setRGB(0, 0, 0);
  live.sky.top.setRGB(0, 0, 0);
  live.sky.horizon.setRGB(0, 0, 0);
  for (const color of live.fruits) color.setRGB(0, 0, 0);
  let foliageShadeMix = 0;

  for (const phase of DAY_PHASES) {
    const weight = phaseWeights[phase];
    if (weight === 0) continue;
    const parsed = phases[phase];
    for (const key of COLOR_KEYS) addScaled(live[key], parsed.colors[key], weight);
    addScaled(live.sky.top, parsed.skyTop, weight);
    addScaled(live.sky.horizon, parsed.skyHorizon, weight);
    live.fruits.forEach((color, i) => {
      const source = parsed.fruits[i];
      if (source) addScaled(color, source, weight);
    });
    foliageShadeMix += DAY_CYCLE.looks[phase].foliageShadeMix * weight;
  }

  for (const color of live.leaves) color.setRGB(0, 0, 0);
  for (const color of live.grass) color.setRGB(0, 0, 0);
  live.blossom.setRGB(0, 0, 0);
  live.blossomHeart.setRGB(0, 0, 0);
  let chill = 0;
  scratch.setRGB(0, 0, 0);
  for (const season of SEASONS) {
    const weight = seasonWeights[season];
    if (weight === 0) continue;
    const parsed = seasons[season];
    live.leaves.forEach((color, i) => {
      const source = parsed.leaves[i];
      if (source) addScaled(color, source, weight);
    });
    live.grass.forEach((color, i) => {
      const source = parsed.grass[i];
      if (source) addScaled(color, source, weight);
    });
    addScaled(live.blossom, parsed.blossom, weight);
    addScaled(live.blossomHeart, parsed.blossomHeart, weight);
    addScaled(scratch, parsed.chill, weight * SEASON_LOOK[season].chill);
    chill += weight * SEASON_LOOK[season].chill;
  }

  for (const color of live.leaves) color.lerp(live.foliageShade, foliageShadeMix);
  for (const color of live.grass) color.lerp(live.foliageShade, foliageShadeMix);
  live.blossom.lerp(live.foliageShade, foliageShadeMix);
  // A pale winter sky by day; at night the dark has the last word.
  const daylightChill = chill * (1 - phaseWeights.night);
  if (daylightChill > 0) {
    // The chill color, averaged over the seasons that bring it.
    scratch.multiplyScalar(1 / chill);
    live.sky.top.lerp(scratch, daylightChill);
    live.sky.horizon.lerp(scratch, daylightChill);
    live.hill.lerp(scratch, daylightChill);
  }
}

function addScaled(target: Color, source: Color, weight: number): void {
  target.r += source.r * weight;
  target.g += source.g * weight;
  target.b += source.b * weight;
}
