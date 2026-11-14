import styles from '../Controls/PillButton.module.css';

interface OriginsMapButtonProps {
  readonly onClick: () => void;
}

/** Opens the map of where the family comes from. */
export function OriginsMapButton({ onClick }: OriginsMapButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {/* A folded paper map with a pin. */}
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </svg>
      De dónde venimos
    </button>
  );
}
