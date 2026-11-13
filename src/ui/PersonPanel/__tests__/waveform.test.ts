import { describe, expect, it } from 'vitest';
import { peaksOf, placeholderPeaks } from '../waveform';

describe('peaksOf', () => {
  it('takes the loudest sample of each slice, scaled to the loudest bar', () => {
    const samples = new Float32Array([0.1, -0.2, 0.4, -0.8, 0, 0]);
    expect(peaksOf(samples, 3, 0)).toEqual([0.25, 1, 0]);
  });

  it('keeps every bar above the floor', () => {
    const peaks = peaksOf(new Float32Array([0, 0, 1, 1]), 2, 0.2);
    expect(peaks).toEqual([0.2, 1]);
  });

  it('gives flat bars for silence', () => {
    expect(peaksOf(new Float32Array(10), 5, 0.1)).toEqual([0.1, 0.1, 0.1, 0.1, 0.1]);
  });
});

describe('placeholderPeaks', () => {
  it('is deterministic and within range', () => {
    const peaks = placeholderPeaks('jose-gomez/historia.mp3', 40, 0.12);
    expect(peaks).toEqual(placeholderPeaks('jose-gomez/historia.mp3', 40, 0.12));
    expect(peaks).toHaveLength(40);
    for (const peak of peaks) {
      expect(peak).toBeGreaterThanOrEqual(0.12);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });
});
