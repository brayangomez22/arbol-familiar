import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import styles from './Timeline.module.css';

/** The year the tree shows, large, and how many of the family are there in it. */
export function YearDisplay() {
  const { timeline } = useFamily();
  const year = useAppStore((state) => state.timelineYear);
  // Announcing every year while ▶ runs would flood a screen reader.
  const playing = useAppStore((state) => state.timelinePlaying);
  const census = timeline.censusAt(year);
  const present = census.alive + census.deceased;

  // Today needs no heading: the tree simply is as it is. The year shows once the slider moves.
  return (
    <div
      className={year === null ? `${styles.year} ${styles.resting}` : styles.year}
      aria-live={playing ? 'off' : 'polite'}
    >
      <p className={styles.yearNumber}>{year ?? 'Hoy'}</p>
      <p className={styles.census}>
        {present === 1 ? '1 persona' : `${present} personas`}
        {census.deceased > 0 && ` · ${census.deceased} en el recuerdo`}
      </p>
    </div>
  );
}
