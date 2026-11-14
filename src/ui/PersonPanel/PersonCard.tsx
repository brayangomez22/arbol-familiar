import type { Person } from '@/domain/types';
import { Bio } from './Bio';
import { PersonHeader } from './PersonHeader';
import styles from './PersonCard.module.css';
import { Polaroids } from './Polaroids';
import { Relations } from './Relations';
import type { PanelLayout } from './usePanelLayout';
import type { SheetDragHandlers, SheetSize } from './useSheetDrag';
import { VoiceNote } from './VoiceNote';

interface PersonCardProps {
  readonly person: Person;
  readonly layout: PanelLayout;
  readonly sheetSize: SheetSize;
  readonly onToggleSize: () => void;
  readonly onClose: () => void;
  /** Drag handlers for the top of the bottom sheet; none for the side panel. */
  readonly grip: SheetDragHandlers | undefined;
  /** Shown inside the accessible list, where the tree's arrow-key shortcuts are off. */
  readonly embedded?: boolean;
}

/** Everything about one person: who they are, their photos, story, voice and family. */
export function PersonCard({
  person,
  layout,
  sheetSize,
  onToggleSize,
  onClose,
  grip,
  embedded = false,
}: PersonCardProps) {
  return (
    <>
      <div className={`${styles.top} ${grip ? styles.grip : ''}`} {...grip}>
        {layout === 'sheet' && (
          <button
            type="button"
            className={styles.handle}
            aria-label={sheetSize === 'peek' ? 'Ampliar la ficha' : 'Reducir la ficha'}
            aria-expanded={sheetSize === 'full'}
            onClick={onToggleSize}
          />
        )}
        <PersonHeader person={person} />
        <button
          type="button"
          className={styles.close}
          aria-label="Cerrar la ficha"
          title="Cerrar (Esc)"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className={styles.body}>
        {person.photos.length > 0 && <Polaroids person={person} />}
        {person.bio !== undefined && <Bio text={person.bio} />}
        {person.audio && <VoiceNote clip={person.audio} />}
        <Relations personId={person.id} />
        {layout === 'side' && !embedded && (
          <p className={styles.hint}>
            <kbd>←</kbd> <kbd>→</kbd> hermanos · <kbd>↑</kbd> padres · <kbd>↓</kbd> hijos ·{' '}
            <kbd>Esc</kbd> cerrar
          </p>
        )}
      </div>
    </>
  );
}
