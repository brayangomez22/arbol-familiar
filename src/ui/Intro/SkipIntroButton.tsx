import { useEffect } from 'react';
import { useAppStore } from '@/state/store';
import styles from './SkipIntroButton.module.css';

/** "Saltar" while the intro plays; Escape does the same. */
export function SkipIntroButton() {
  const playing = useAppStore((state) => state.introPhase === 'playing');
  const setIntroPhase = useAppStore((state) => state.setIntroPhase);

  useEffect(() => {
    if (!playing) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIntroPhase('done');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playing, setIntroPhase]);

  if (!playing) return null;
  return (
    <button
      type="button"
      className={styles.skip}
      onClick={() => {
        setIntroPhase('done');
      }}
    >
      Saltar
    </button>
  );
}
