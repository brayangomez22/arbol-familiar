import { useFamily } from '../family/familyDirectory';
import { PlayButton } from './PlayButton';
import styles from './Timeline.module.css';
import { TimelineSlider } from './TimelineSlider';
import { useTimelinePlayback } from './useTimelinePlayback';
import { YearDisplay } from './YearDisplay';

/** The family's years along the bottom: drag them, or press ▶, and the tree grows through them. */
export function Timeline() {
  const { timeline } = useFamily();
  useTimelinePlayback(timeline.range);

  return (
    <section className={styles.dock} aria-label="Línea de tiempo">
      <div className={styles.stack}>
        <YearDisplay />
        <div className={styles.bar}>
          <PlayButton />
          <TimelineSlider />
        </div>
      </div>
    </section>
  );
}
