import { SearchButton } from '../Search/SearchButton';
import styles from './Controls.module.css';
import { ReplayIntroButton } from './ReplayIntroButton';
import { ZoomControls } from './ZoomControls';

interface ControlsProps {
  readonly onSearch: () => void;
}

/** The floating buttons in the corner: search, see the intro again, and the zoom group. */
export function Controls({ onSearch }: ControlsProps) {
  return (
    <div className={styles.column}>
      <SearchButton onClick={onSearch} />
      <ReplayIntroButton />
      <ZoomControls />
    </div>
  );
}
