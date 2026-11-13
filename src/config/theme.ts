export interface SkyPalette {
  readonly top: string;
  readonly horizon: string;
}

export interface Palette {
  readonly sky: SkyPalette;
  readonly trunk: string;
  readonly trunkShadow: string;
  readonly leaves: readonly string[];
  readonly fruits: readonly string[];
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
  readonly grass: readonly string[];
  readonly cloud: string;
  readonly cloudShade: string;
  /** Glow of the sun (or moon) in the sky. */
  readonly sunGlow: string;
  readonly pollen: string;
  /** The vignette multiplies the corners by this color. */
  readonly vignette: string;
  /** White border of the photos in a person's panel. */
  readonly polaroid: string;
}

export const dayPalette: Palette = {
  sky: { top: '#c9dbe3', horizon: '#f6dcc4' },
  trunk: '#8a5a3c',
  trunkShadow: '#5e3b27',
  leaves: ['#8fa883', '#7d9471', '#a3b18a', '#6f7f5a'],
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
  grass: ['#7f9358', '#6e824c', '#93a466', '#62753f'],
  cloud: '#fff8ee',
  cloudShade: '#efd6cc',
  sunGlow: '#fff1cf',
  pollen: '#fff4cf',
  vignette: '#c9a98c',
  polaroid: '#fffcf5',
};

export const nightPalette: Palette = {
  sky: { top: '#1c1f4a', horizon: '#3b3470' },
  trunk: '#4a3a4f',
  trunkShadow: '#2a2135',
  leaves: ['#3e5a5a', '#35504d', '#4a6461', '#2c4441'],
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
  grass: ['#34484c', '#2c4044', '#3d5357', '#253a3d'],
  cloud: '#3e3f74',
  cloudShade: '#2c2c5c',
  sunGlow: '#c9c4ff',
  pollen: '#ffe6a3',
  vignette: '#0b0a20',
  polaroid: '#f4ecdc',
};

export const fonts = {
  display: "'Fraunces Variable', 'Georgia', serif",
  body: "'Inter Variable', system-ui, sans-serif",
} as const;
