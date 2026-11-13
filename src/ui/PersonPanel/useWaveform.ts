import { useEffect, useState } from 'react';
import { PERSON_PANEL } from '@/config/constants';
import { mediaUrl } from '../family/mediaUrl';
import { peaksOf, placeholderPeaks } from './waveform';

const { waveformBars, waveformFloor } = PERSON_PANEL;

/**
 * The real shape of a voice note, decoded once its panel is open. Until then, or if decoding
 * fails, a seeded placeholder that never changes for the same clip.
 */
export function useWaveform(src: string): readonly number[] {
  const [decoded, setDecoded] = useState<{ src: string; peaks: number[] } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch(mediaUrl(src), { signal: abort.signal })
      .then((response) => response.arrayBuffer())
      // Offline: decoding needs no audio output, and never asks the browser to start sound.
      .then((buffer) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(buffer))
      .then((audio) => {
        if (abort.signal.aborted) return;
        setDecoded({ src, peaks: peaksOf(audio.getChannelData(0), waveformBars, waveformFloor) });
      })
      .catch(() => {
        // The placeholder stays: the note still plays.
      });
    return () => {
      abort.abort();
    };
  }, [src]);

  return decoded?.src === src ? decoded.peaks : placeholderPeaks(src, waveformBars, waveformFloor);
}
