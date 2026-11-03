import { DEBUG_VIEW } from '@/config/constants';

export interface LayoutDebugOptions {
  /** When set, a synthetic family of about this many people replaces family.json. */
  readonly syntheticSize: number | null;
  readonly seed: string;
  readonly showLabels: boolean;
}

/**
 * Reads `?debug=layout[&people=80][&seed=b][&labels=0]`. Returns null when the layout view was not
 * requested, so the regular experience loads.
 */
export function readLayoutDebugOptions(search: string): LayoutDebugOptions | null {
  const params = new URLSearchParams(search);
  if (params.get('debug') !== 'layout') return null;

  const size = Number(params.get('people'));
  return {
    syntheticSize: Number.isInteger(size) && size > 0 ? size : null,
    seed: params.get('seed') ?? DEBUG_VIEW.defaultSeed,
    showLabels: params.get('labels') !== '0',
  };
}
