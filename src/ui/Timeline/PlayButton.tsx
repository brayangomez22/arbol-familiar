import { useAppStore } from '@/state/store';
import styles from './Timeline.module.css';

/** ▶ runs through the family's years, one at a time; ❚❚ stops where it is. */
export function PlayButton() {
  const playing = useAppStore((state) => state.timelinePlaying);
  const setPlaying = useAppStore((state) => state.setTimelinePlaying);
  const label = playing ? 'Pausar el recorrido por los años' : 'Recorrer los años';

  return (
    <button
      type="button"
      className={styles.play}
      aria-label={label}
      title={label}
      aria-pressed={playing}
      onClick={() => {
        setPlaying(!playing);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M8 5.5v13l11-6.5-11-6.5Z" />}
      </svg>
    </button>
  );
}
