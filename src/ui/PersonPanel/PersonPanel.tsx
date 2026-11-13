import { useEffect, useRef, useState } from 'react';
import { getPerson } from '@/domain/genealogy';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { fullName } from '../family/personText';
import { PersonCard } from './PersonCard';
import styles from './PersonPanel.module.css';
import { usePanelLayout } from './usePanelLayout';
import { usePersonShortcuts } from './usePersonShortcuts';
import { useSheetDrag, type SheetSize } from './useSheetDrag';

interface PersonPanelProps {
  /** Shortcuts only work once the overlay is showing. */
  readonly enabled: boolean;
}

/** The selected person's panel: beside the tree on wide screens, a sheet from the bottom on phones. */
export function PersonPanel({ enabled }: PersonPanelProps) {
  const { index } = useFamily();
  const selectedId = useAppStore((state) => state.selectedPersonId);
  const selectPerson = useAppStore((state) => state.selectPerson);
  const layout = usePanelLayout();
  usePersonShortcuts(enabled);
  const sheet = useRef<HTMLElement>(null);
  const open = selectedId !== null;

  // The last person stays on the panel while it slides away, instead of vanishing first.
  const [shownId, setShownId] = useState(selectedId);
  const [sheetSize, setSheetSize] = useState<SheetSize>('peek');
  const [wasOpen, setWasOpen] = useState(open);
  if (selectedId !== null && selectedId !== shownId) setShownId(selectedId);
  if (open !== wasOpen) {
    setWasOpen(open);
    // Every opening starts at rest, from the bottom.
    if (open) setSheetSize('peek');
  }
  useEffect(() => {
    // A sheet closed by dragging kept the height the finger left it at.
    if (open) sheet.current?.style.removeProperty('height');
  }, [open]);

  const close = () => {
    selectPerson(null);
  };
  const drag = useSheetDrag(sheet, sheetSize, setSheetSize, close);
  const shown = shownId === null ? undefined : index.family.people.get(shownId);

  return (
    <>
      <aside
        ref={sheet}
        className={`${styles.panel} ${styles[layout]}`}
        data-open={open}
        data-size={sheetSize}
        aria-label={shown ? `Ficha de ${fullName(shown)}` : 'Ficha'}
        inert={!open}
      >
        {shown && (
          <PersonCard
            key={shown.id}
            person={shown}
            layout={layout}
            sheetSize={sheetSize}
            onToggleSize={() => {
              setSheetSize(sheetSize === 'peek' ? 'full' : 'peek');
            }}
            onClose={close}
            grip={layout === 'sheet' ? drag : undefined}
          />
        )}
      </aside>
      <p className={styles.announcer} aria-live="polite">
        {selectedId === null ? '' : fullName(getPerson(index, selectedId))}
      </p>
    </>
  );
}
