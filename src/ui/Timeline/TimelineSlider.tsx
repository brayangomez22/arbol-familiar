import type { CSSProperties } from 'react';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import styles from './Timeline.module.css';

/**
 * A native range input, so it works with keys and screen readers. Its last year is "today": the
 * whole tree as it is now, including deaths whose year nobody remembers.
 */
export function TimelineSlider() {
  const { range, marks } = useFamily().timeline;
  const year = useAppStore((state) => state.timelineYear);
  const setYear = useAppStore((state) => state.setTimelineYear);
  const setPlaying = useAppStore((state) => state.setTimelinePlaying);
  const span = Math.max(range.last - range.first, 1);
  const value = year ?? range.last;
  const positionOf = (mark: number) => `${((mark - range.first) / span) * 100}%`;

  return (
    <div className={styles.track}>
      <input
        type="range"
        className={styles.slider}
        min={range.first}
        max={range.last}
        step={1}
        value={value}
        aria-label="Año"
        aria-valuetext={year === null ? `Hoy, ${range.last}` : String(year)}
        style={{ '--progress': positionOf(value) } as CSSProperties}
        onChange={(event) => {
          const picked = Number(event.target.value);
          // Taking the slider stops ▶: the hand wins.
          setPlaying(false);
          setYear(picked >= range.last ? null : picked);
        }}
      />
      <ol className={styles.marks} aria-hidden="true">
        {marks.map((mark, i) => (
          <li
            key={mark}
            className={i % 2 === 0 ? styles.mark : `${styles.mark} ${styles.minor}`}
            style={{ left: positionOf(mark) }}
          >
            <span>{mark}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
