import { describe, expect, it } from 'vitest';
import { AUDIO } from '@/config/constants';
import { mixTargets, popFrequency } from '../audioMix';

describe('mixTargets', () => {
  it('stays silent until the visitor turns the sound on', () => {
    expect(mixTargets({ enabled: false, voiceNotePlaying: false, pageVisible: true }).master).toBe(
      0,
    );
    expect(mixTargets({ enabled: true, voiceNotePlaying: false, pageVisible: true }).master).toBe(
      1,
    );
  });

  it('goes quiet while the tab is in the background', () => {
    expect(mixTargets({ enabled: true, voiceNotePlaying: false, pageVisible: false }).master).toBe(
      0,
    );
  });

  it('ducks music and wind under a voice note', () => {
    const ducked = mixTargets({ enabled: true, voiceNotePlaying: true, pageVisible: true });
    expect(ducked.master).toBe(1);
    expect(ducked.ambience).toBe(AUDIO.duckLevel);
  });
});

describe('popFrequency', () => {
  it('gives each person a stable note of the scale', () => {
    const scale = AUDIO.pop.notes.map((midi) => 440 * 2 ** ((midi - 69) / 12));
    expect(popFrequency('ana-alvarez')).toBe(popFrequency('ana-alvarez'));
    expect(scale).toContain(popFrequency('ana-alvarez'));
    expect(scale).toContain(popFrequency('jose-gomez'));
  });
});
