import buttonStyles from '../Controls/RoundButton.module.css';

interface SearchButtonProps {
  readonly onClick: () => void;
}

/** The magnifying glass that opens the search. */
export function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      type="button"
      className={buttonStyles.button}
      aria-label="Buscar a alguien"
      aria-keyshortcuts="/"
      title="Buscar (/)"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </svg>
    </button>
  );
}
