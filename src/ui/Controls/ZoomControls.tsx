import { useAppStore } from '@/state/store';
import styles from './ZoomControls.module.css';
import { useCameraShortcuts } from './useCameraShortcuts';

/** Floating zoom buttons: the same as the wheel, pinch and the `0` key, for every visitor. */
export function ZoomControls() {
  const requestCamera = useAppStore((state) => state.requestCamera);
  useCameraShortcuts();

  return (
    <div className={styles.controls} role="group" aria-label="Zoom del árbol">
      <button
        type="button"
        className={styles.button}
        aria-label="Acercar"
        title="Acercar (+)"
        onClick={() => {
          requestCamera('zoomIn');
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Alejar"
        title="Alejar (−)"
        onClick={() => {
          requestCamera('zoomOut');
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Ver todo el árbol"
        title="Ver todo el árbol (0)"
        onClick={() => {
          requestCamera('frameAll');
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
        </svg>
      </button>
    </div>
  );
}
