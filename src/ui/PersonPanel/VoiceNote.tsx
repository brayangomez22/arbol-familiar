import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PERSON_PANEL } from '@/config/constants';
import type { AudioClip } from '@/domain/types';
import { useAppStore } from '@/state/store';
import { mediaUrl } from '../family/mediaUrl';
import sectionStyles from './Section.module.css';
import { useWaveform } from './useWaveform';
import styles from './VoiceNote.module.css';

interface VoiceNoteProps {
  readonly clip: AudioClip;
}

function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The person's voice: play, pause and a waveform that fills as it plays and seeks on click or with
 * the arrows. The ambient music steps aside while it plays.
 */
export function VoiceNote({ clip }: VoiceNoteProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const peaks = useWaveform(clip.src);
  const setVoiceNotePlaying = useAppStore((state) => state.setVoiceNotePlaying);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });

  // Progress follows every frame on the element itself; the clock only needs `timeupdate`.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const element = audio.current;
      if (element && element.duration > 0) {
        wave.current?.style.setProperty(
          '--progress',
          String(element.currentTime / element.duration),
        );
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [playing]);

  // Another person's panel, or none: the note stops and the music may come back.
  useEffect(() => {
    const element = audio.current;
    return () => {
      element?.pause();
      setVoiceNotePlaying(false);
    };
  }, [setVoiceNotePlaying]);

  const seek = (seconds: number) => {
    const element = audio.current;
    if (!element || !(element.duration > 0)) return;
    element.currentTime = Math.min(element.duration, Math.max(0, seconds));
    wave.current?.style.setProperty('--progress', String(element.currentTime / element.duration));
    setTime({ current: element.currentTime, duration: element.duration });
  };

  const syncTime = () => {
    const element = audio.current;
    if (element) setTime({ current: element.currentTime, duration: element.duration || 0 });
  };

  const setPlayback = (isPlaying: boolean) => {
    setPlaying(isPlaying);
    setVoiceNotePlaying(isPlaying);
  };

  return (
    <section>
      <h3 className={sectionStyles.title}>Su voz</h3>
      {clip.caption !== undefined && <p className={styles.caption}>{clip.caption}</p>}
      <div className={styles.player}>
        <button
          type="button"
          className={styles.play}
          aria-label={playing ? 'Pausar la nota de voz' : 'Escuchar la nota de voz'}
          onClick={() => {
            const element = audio.current;
            if (!element) return;
            if (element.paused) void element.play().catch(() => undefined);
            else element.pause();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M8 5.5v13l11-6.5-11-6.5Z" />}
          </svg>
        </button>
        <div
          ref={wave}
          className={styles.wave}
          role="slider"
          tabIndex={0}
          aria-label="Posición de la nota de voz"
          aria-valuemin={0}
          aria-valuemax={Math.round(time.duration)}
          aria-valuenow={Math.round(time.current)}
          aria-valuetext={`${clock(time.current)} de ${clock(time.duration)}`}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            seek(((event.clientX - box.left) / box.width) * time.duration);
          }}
          onKeyDown={(event) => {
            const step = PERSON_PANEL.voiceSeekStep;
            const targets: Partial<Record<string, number>> = {
              ArrowLeft: time.current - step,
              ArrowDown: time.current - step,
              ArrowRight: time.current + step,
              ArrowUp: time.current + step,
              Home: 0,
              End: time.duration,
            };
            const target = targets[event.key];
            if (target === undefined) return;
            // Handled here: the arrows must not also move to another person.
            event.preventDefault();
            seek(target);
          }}
        >
          {peaks.map((peak, bar) => (
            <span
              key={bar}
              className={styles.bar}
              style={{ '--peak': peak, '--at': bar / peaks.length } as CSSProperties}
            />
          ))}
        </div>
        <span className={styles.clock}>
          {clock(time.current)} / {clock(time.duration)}
        </span>
      </div>
      <audio
        ref={audio}
        src={mediaUrl(clip.src)}
        preload="metadata"
        onPlay={() => {
          setPlayback(true);
        }}
        onPause={() => {
          setPlayback(false);
        }}
        onEnded={() => {
          setPlayback(false);
        }}
        onTimeUpdate={syncTime}
        onLoadedMetadata={syncTime}
      />
    </section>
  );
}
