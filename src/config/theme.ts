import type { DayPhase } from '@/domain/dayCycle';
import type { Season } from '@/domain/seasons';

export interface SkyPalette {
  readonly top: string;
  readonly horizon: string;
}

export interface Palette {
  readonly sky: SkyPalette;
  readonly trunk: string;
  readonly trunkShadow: string;
  /** One per fruit material; same length in every palette, so a person keeps their slot. */
  readonly fruits: FruitColors;
  readonly deceasedFruit: string;
  readonly ground: string;
  readonly ink: string;
  readonly paper: string;
  /** Tint every toon shadow leans toward, so shade reads as colored light rather than black. */
  readonly shade: string;
  /** Lightest toon band. */
  readonly light: string;
  /** Soft back light on the sunny edge of every shape. */
  readonly rim: string;
  /** Contour lines: warm and dark, never pure black. */
  readonly outline: string;
  /** Glow behind each fruit. */
  readonly halo: string;
  /** The glow of a hovered or selected fruit warms toward this. */
  readonly haloGlow: string;
  /** Specks of light that rise from a hovered fruit. */
  readonly spark: string;
  /** Light that runs up the selected person's lineage. */
  readonly sap: string;
  /** Puff of earth where the seed lands in the intro. */
  readonly dust: string;
  readonly hill: string;
  /** Leaves and grass lean toward this with the light of the hour (see DAY_CYCLE in constants). */
  readonly foliageShade: string;
  readonly cloud: string;
  readonly cloudShade: string;
  /** Glow of the sun (or moon) in the sky. */
  readonly sunGlow: string;
  readonly pollen: string;
  readonly firefly: string;
  readonly stars: string;
  /** The vignette multiplies the corners by this color. */
  readonly vignette: string;
  /** White border of the photos in a person's panel. */
  readonly polaroid: string;
}

export const dayPalette: Palette = {
  sky: { top: '#c9dbe3', horizon: '#f6dcc4' },
  trunk: '#8a5a3c',
  trunkShadow: '#5e3b27',
  fruits: ['#c8664a', '#d9a441', '#8e4a63', '#3f7f7a', '#b9774e'],
  deceasedFruit: '#d8b45a',
  ground: '#cdbb93',
  ink: '#3b2a20',
  paper: '#fbf4e8',
  shade: '#5d4a6e',
  light: '#fff4dc',
  rim: '#ffe0b5',
  outline: '#4a3024',
  halo: '#fff3da',
  haloGlow: '#ffd27f',
  spark: '#f6be55',
  sap: '#ffd36e',
  dust: '#a88a5c',
  hill: '#a7b07a',
  foliageShade: '#fff4dc',
  cloud: '#fff8ee',
  cloudShade: '#efd6cc',
  sunGlow: '#fff1cf',
  pollen: '#fff4cf',
  firefly: '#fff2a8',
  stars: '#fffaf0',
  vignette: '#c9a98c',
  polaroid: '#fffcf5',
};

export const nightPalette: Palette = {
  sky: { top: '#1c1f4a', horizon: '#3b3470' },
  trunk: '#4a3a4f',
  trunkShadow: '#2a2135',
  fruits: ['#ffb070', '#ffd27a', '#e59ab8', '#8fd6c8', '#f2a26b'],
  deceasedFruit: '#ffd98a',
  ground: '#2b2a45',
  ink: '#f3ead9',
  paper: '#24224a',
  shade: '#15163a',
  light: '#d9d2ff',
  rim: '#8f86d6',
  outline: '#0f0e26',
  halo: '#ffd9a0',
  haloGlow: '#ffc56e',
  spark: '#ffe08a',
  sap: '#ffe29a',
  dust: '#5a5274',
  hill: '#2f3d4a',
  foliageShade: '#22324a',
  cloud: '#3e3f74',
  cloudShade: '#2c2c5c',
  sunGlow: '#c9c4ff',
  pollen: '#ffe6a3',
  firefly: '#f4ff9a',
  stars: '#fff6dc',
  vignette: '#0b0a20',
  polaroid: '#f4ecdc',
};

/** First light: peach and rose, long violet shadows. */
export const dawnPalette: Palette = {
  ...dayPalette,
  sky: { top: '#a9b6d6', horizon: '#f7c6a8' },
  trunk: '#7f5240',
  trunkShadow: '#523346',
  ground: '#c4a98f',
  shade: '#5a4880',
  light: '#ffe0cc',
  rim: '#ffc7a8',
  outline: '#43293a',
  hill: '#9a9c7e',
  foliageShade: '#f0b8a8',
  cloud: '#ffefe6',
  cloudShade: '#e8b8c0',
  sunGlow: '#ffd6b0',
  vignette: '#b88f99',
};

/** Golden hour sliding into lilac. */
export const duskPalette: Palette = {
  ...dayPalette,
  sky: { top: '#7d7fb8', horizon: '#f2a477' },
  trunk: '#7a4a38',
  trunkShadow: '#4a2a3c',
  ground: '#b88f74',
  shade: '#4b3a72',
  light: '#ffd2a6',
  rim: '#ffb27a',
  outline: '#3a2232',
  halo: '#ffe3b5',
  hill: '#8d8a6a',
  foliageShade: '#d9906c',
  cloud: '#ffe0cc',
  cloudShade: '#c98fa0',
  sunGlow: '#ffc58a',
  vignette: '#8a6378',
};

/** The look of each moment of the day; DAY_CYCLE in constants says when each one rules. */
export const dayPhasePalettes: Readonly<Record<DayPhase, Palette>> = {
  dawn: dawnPalette,
  day: dayPalette,
  dusk: duskPalette,
  night: nightPalette,
};

export type FruitColors = readonly [string, string, string, string, string];
/** Leaves and grass come in four tones each, picked per instance. */
export type FoliageColors = readonly [string, string, string, string];

export interface SeasonPalette {
  readonly leaves: FoliageColors;
  readonly grass: FoliageColors;
  readonly blossom: string;
  readonly blossomHeart: string;
  /** Sky and hill lean toward this in the cold months; how much is SEASON_LOOK.chill. */
  readonly chill: string;
}

/**
 * Leaves through the year. Colombia has no seasons to speak of: this is an aesthetic choice,
 * the tree of an illustrated calendar.
 */
export const seasonPalettes: Readonly<Record<Season, SeasonPalette>> = {
  spring: {
    leaves: ['#9cbf86', '#86ab73', '#b4cc8e', '#7a9a62'],
    grass: ['#86a35c', '#759350', '#9bb46a', '#678543'],
    blossom: '#f6c9d0',
    blossomHeart: '#e8a33d',
    chill: '#dfe8f0',
  },
  summer: {
    leaves: ['#8fa883', '#7d9471', '#a3b18a', '#6f7f5a'],
    grass: ['#7f9358', '#6e824c', '#93a466', '#62753f'],
    blossom: '#fbe3c4',
    blossomHeart: '#e0a040',
    chill: '#dfe8f0',
  },
  autumn: {
    leaves: ['#d19a4a', '#b9683a', '#e0b45c', '#9a7a45'],
    grass: ['#a39a5a', '#8f8648', '#b5a86a', '#7a7340'],
    blossom: '#f3d7b0',
    blossomHeart: '#c9772f',
    chill: '#e3dccf',
  },
  winter: {
    leaves: ['#8a9a8c', '#7b8b80', '#9eaa9a', '#6c7a70'],
    grass: ['#93998a', '#858b7c', '#a3a898', '#767c6e'],
    blossom: '#f4f2ee',
    blossomHeart: '#d9b45a',
    chill: '#d6e2f0',
  },
};

/** Birthday flowers: always in bloom, whatever the season. */
export const birthdayBlossom = { petals: '#f7b8c6', heart: '#f2c14e' } as const;

/** Golden leaves that fall, now and then, near those who have passed. */
export const memorialLeaf = '#e2b85c';

export const fonts = {
  display: "'Fraunces Variable', 'Georgia', serif",
  body: "'Inter Variable', system-ui, sans-serif",
} as const;
