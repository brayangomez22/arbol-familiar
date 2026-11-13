import { AUDIO } from '@/config/constants';
import { hashString } from '@/layout/random';

export interface MixState {
  /** The visitor turned the sound on. */
  readonly enabled: boolean;
  readonly voiceNotePlaying: boolean;
  /** The tab is in view: in the background, everything goes quiet. */
  readonly pageVisible: boolean;
}

export interface MixTargets {
  /** Everything, 0 or 1: the fades in and out happen on the way. */
  readonly master: number;
  /** Music and wind, ducked under a voice note. */
  readonly ambience: number;
}

export function mixTargets({ enabled, voiceNotePlaying, pageVisible }: MixState): MixTargets {
  return {
    master: enabled && pageVisible ? 1 : 0,
    ambience: voiceNotePlaying ? AUDIO.duckLevel : 1,
  };
}

/** Each person's pop is always the same note of the music's scale. */
export function popFrequency(personId: string): number {
  const notes = AUDIO.pop.notes;
  const midi = notes[hashString(personId) % notes.length] ?? notes[0];
  return 440 * 2 ** ((midi - 69) / 12);
}
