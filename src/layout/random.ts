export interface Random {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  range(min: number, max: number): number;
  /** Uniform in [-1, 1). */
  signed(): number;
  /** Integer in [min, max], both included. */
  int(min: number, max: number): number;
}

/** FNV-1a: a fast 32-bit hash, good enough to spread string seeds. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic stream for one aspect of one element, e.g. createRandom('ana-alvarez', 'branch').
 * Separate streams per aspect keep a new draw in one place from shifting every other shape.
 */
export function createRandom(...seedParts: readonly string[]): Random {
  const next = mulberry32(hashString(seedParts.join('\u0000')));
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    signed: () => next() * 2 - 1,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
  };
}
