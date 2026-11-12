import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppStore } from '@/state/store';
import buttonStyles from './RoundButton.module.css';

/** Plays the growing intro again from the seed. Not offered with reduced motion, which has none. */
export function ReplayIntroButton() {
  const replayIntro = useAppStore((state) => state.replayIntro);
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <button
      type="button"
      className={buttonStyles.button}
      aria-label="Ver la intro de nuevo"
      title="Ver la intro de nuevo"
      onClick={() => {
        replayIntro();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {/* A sprout: what the intro grows from. */}
        <path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6ZM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
      </svg>
    </button>
  );
}
