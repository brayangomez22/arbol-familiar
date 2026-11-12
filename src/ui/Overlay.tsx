import { useAppStore } from '@/state/store';
import { Controls } from './Controls/Controls';
import { SkipIntroButton } from './Intro/SkipIntroButton';
import styles from './Overlay.module.css';
import { TitleCard, type FamilySummary } from './TitleCard/TitleCard';

interface OverlayProps {
  readonly summary: FamilySummary;
}

/** Everything drawn in DOM over the canvas. Hidden until the intro is over. */
export function Overlay({ summary }: OverlayProps) {
  const ready = useAppStore((state) => state.introPhase === 'done');
  return (
    <>
      <div className={`${styles.overlay} ${ready ? '' : styles.hidden}`} aria-hidden={!ready}>
        <TitleCard summary={summary} />
        <Controls />
      </div>
      <SkipIntroButton />
    </>
  );
}
