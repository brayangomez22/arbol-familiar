import styles from './Controls.module.css';
import { ReplayIntroButton } from './ReplayIntroButton';
import { ZoomControls } from './ZoomControls';

/** The floating buttons in the corner: see the intro again, and the zoom group. */
export function Controls() {
  return (
    <div className={styles.column}>
      <ReplayIntroButton />
      <ZoomControls />
    </div>
  );
}
