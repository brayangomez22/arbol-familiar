import { useAppStore } from '@/state/store';
import buttonStyles from '../Controls/RoundButton.module.css';

/** Enters photo mode: the UI steps aside to frame and keep a picture of the tree. */
export function PhotoButton() {
  const setPhotoMode = useAppStore((state) => state.setPhotoMode);
  return (
    <button
      type="button"
      className={buttonStyles.button}
      aria-label="Modo foto"
      title="Modo foto"
      onClick={() => {
        setPhotoMode(true);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    </button>
  );
}
