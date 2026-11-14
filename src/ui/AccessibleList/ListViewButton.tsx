import { useAppStore } from '@/state/store';
import styles from '../Controls/PillButton.module.css';

/** Opens the family as an accessible list, the equivalent of everything clickable in the tree. */
export function ListViewButton() {
  const setListOpen = useAppStore((state) => state.setListOpen);
  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => {
        setListOpen(true);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
      Ver como lista
    </button>
  );
}
