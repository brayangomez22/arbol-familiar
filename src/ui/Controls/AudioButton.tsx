import { useAppStore } from '@/state/store';
import buttonStyles from './RoundButton.module.css';

/** The speaker: ambient music and sounds, off until the visitor turns them on. */
export function AudioButton() {
  const enabled = useAppStore((state) => state.audioEnabled);
  const setAudioEnabled = useAppStore((state) => state.setAudioEnabled);
  const label = enabled ? 'Silenciar la música' : 'Poner música';

  return (
    <button
      type="button"
      className={buttonStyles.button}
      aria-pressed={enabled}
      aria-label="Música y sonidos"
      title={label}
      onClick={() => {
        setAudioEnabled(!enabled);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
        {enabled ? (
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        ) : (
          <path d="m16 9.5 5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}
