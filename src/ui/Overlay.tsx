import { useCallback, useState, type CSSProperties } from 'react';
import { useAppStore } from '@/state/store';
import { AmbientPicker } from './AmbientPicker/AmbientPicker';
import { BirthdayNotice } from './Birthday/BirthdayNotice';
import { Controls } from './Controls/Controls';
import { FamilyContext, type FamilyDirectory } from './family/familyDirectory';
import { SkipIntroButton } from './Intro/SkipIntroButton';
import { OriginsMap } from './OriginsMap/OriginsMap';
import { OriginsMapButton } from './OriginsMap/OriginsMapButton';
import styles from './Overlay.module.css';
import { PersonPanel } from './PersonPanel/PersonPanel';
import { PhotoMode } from './PhotoMode/PhotoMode';
import { SearchPalette } from './Search/SearchPalette';
import { useSearchShortcut } from './Search/useSearchShortcut';
import { Timeline } from './Timeline/Timeline';
import { TitleCard, type FamilySummary } from './TitleCard/TitleCard';

interface OverlayProps {
  readonly summary: FamilySummary;
  readonly family: FamilyDirectory;
  /** The hidden season and time picker, for `?season=` / `?time=` links. */
  readonly ambientPicker: boolean;
}

/** Everything drawn in DOM over the canvas. Hidden until the intro is over. */
export function Overlay({ summary, family, ambientPicker }: OverlayProps) {
  const ready = useAppStore((state) => state.introPhase === 'done');
  const panelOpen = useAppStore((state) => state.selectedPersonId !== null);
  const inset = useAppStore((state) => state.viewInset);
  const photoMode = useAppStore((state) => state.photoMode);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);
  const closeMap = useCallback(() => {
    setMapOpen(false);
  }, []);
  useSearchShortcut(ready && !searchOpen && !mapOpen && !photoMode, openSearch);

  // What the open panel covers, so the floating buttons and the search move out of its way.
  const occluded = {
    '--occluded-right': `${panelOpen ? inset.right : 0}px`,
    '--occluded-bottom': `${panelOpen ? inset.bottom : 0}px`,
  } as CSSProperties;

  return (
    <FamilyContext value={family}>
      <div
        className={`${styles.overlay} ${ready && !photoMode ? '' : styles.hidden}`}
        style={occluded}
        aria-hidden={!ready || photoMode}
        // In photo mode the UI is gone for the keyboard too, not just for the eyes.
        inert={photoMode}
      >
        <div className={styles.corner}>
          <TitleCard summary={summary} />
          <OriginsMapButton
            onClick={() => {
              setMapOpen(true);
            }}
          />
        </div>
        {ambientPicker && <AmbientPicker />}
        <BirthdayNotice />
        <Timeline />
        <Controls onSearch={openSearch} />
        <PersonPanel enabled={ready} />
        {searchOpen && (
          <SearchPalette
            onClose={() => {
              setSearchOpen(false);
            }}
          />
        )}
        {mapOpen && <OriginsMap onClose={closeMap} />}
      </div>
      {photoMode && <PhotoMode title={summary.title} />}
      <SkipIntroButton />
    </FamilyContext>
  );
}
