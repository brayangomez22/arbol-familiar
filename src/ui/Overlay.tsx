import { useCallback, useState, type CSSProperties } from 'react';
import { useAppStore } from '@/state/store';
import { Controls } from './Controls/Controls';
import { FamilyContext, type FamilyDirectory } from './family/familyDirectory';
import { SkipIntroButton } from './Intro/SkipIntroButton';
import styles from './Overlay.module.css';
import { PersonPanel } from './PersonPanel/PersonPanel';
import { SearchPalette } from './Search/SearchPalette';
import { useSearchShortcut } from './Search/useSearchShortcut';
import { TitleCard, type FamilySummary } from './TitleCard/TitleCard';

interface OverlayProps {
  readonly summary: FamilySummary;
  readonly family: FamilyDirectory;
}

/** Everything drawn in DOM over the canvas. Hidden until the intro is over. */
export function Overlay({ summary, family }: OverlayProps) {
  const ready = useAppStore((state) => state.introPhase === 'done');
  const panelOpen = useAppStore((state) => state.selectedPersonId !== null);
  const inset = useAppStore((state) => state.viewInset);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);
  useSearchShortcut(ready && !searchOpen, openSearch);

  // What the open panel covers, so the floating buttons and the search move out of its way.
  const occluded = {
    '--occluded-right': `${panelOpen ? inset.right : 0}px`,
    '--occluded-bottom': `${panelOpen ? inset.bottom : 0}px`,
  } as CSSProperties;

  return (
    <FamilyContext value={family}>
      <div
        className={`${styles.overlay} ${ready ? '' : styles.hidden}`}
        style={occluded}
        aria-hidden={!ready}
      >
        <TitleCard summary={summary} />
        <Controls onSearch={openSearch} />
        <PersonPanel enabled={ready} />
        {searchOpen && (
          <SearchPalette
            onClose={() => {
              setSearchOpen(false);
            }}
          />
        )}
      </div>
      <SkipIntroButton />
    </FamilyContext>
  );
}
