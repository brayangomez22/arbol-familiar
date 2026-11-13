import { originsMapPalette } from '@/config/theme';

/** Lines are colored by the generation of the children born at their end. */
export function generationColor(generation: number): string {
  const colors = originsMapPalette.generations;
  return colors[Math.max(0, generation - 1) % colors.length] ?? originsMapPalette.place;
}

/** Counted as the title card does: the root couple is the first generation. */
export function generationName(generation: number): string {
  return `${generation + 1}.ª generación`;
}
