import { SearchButton } from '../Search/SearchButton';
import { AudioButton } from './AudioButton';
import styles from './Controls.module.css';
import { ReplayIntroButton } from './ReplayIntroButton';
import { ZoomControls } from './ZoomControls';

interface ControlsProps {
  readonly onSearch: () => void;
}

/** The floating buttons in the corner: search, see the intro again, sound, and the zoom group. */
export function Controls({ onSearch }: ControlsProps) {
  return (
    <div className={styles.column}>
      <SearchButton onClick={onSearch} />
      <ReplayIntroButton />
      <AudioButton />
      <ZoomControls />
    </div>
  );
}
