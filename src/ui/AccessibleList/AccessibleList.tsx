import { useEffect, useRef, type ReactNode } from 'react';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { fullName } from '../family/personText';
import { PersonCard } from '../PersonPanel/PersonCard';
import styles from './AccessibleList.module.css';
import { CoupleEntry } from './CoupleEntry';

interface AccessibleListProps {
  /** A line under the title: why the list is showing. */
  readonly lead: ReactNode;
  /** The way out, if there is one (back to the tree). */
  readonly action?: ReactNode;
}

/**
 * The family as nested lists, from the root couple down, with the same card the tree opens. Every
 * person is a button, so it works with the keyboard and reads well with a screen reader. On narrow
 * screens the card takes the place of the list while it is open, and closing it goes back.
 */
export function AccessibleList({ lead, action }: AccessibleListProps) {
  const { index, outline } = useFamily();
  const selectedId = useAppStore((state) => state.selectedPersonId);
  const selectPerson = useAppStore((state) => state.selectPerson);
  const list = useRef<HTMLElement>(null);
  const card = useRef<HTMLElement>(null);
  const previousId = useRef(selectedId);
  const selected = selectedId === null ? undefined : index.family.people.get(selectedId);

  // Focus follows what the visitor did: into the card when they chose someone, back to that
  // person in the list when they closed it.
  useEffect(() => {
    const previous = previousId.current;
    previousId.current = selectedId;
    if (selectedId === previous) return;
    if (selectedId !== null) {
      card.current?.focus();
    } else if (previous !== null) {
      list.current
        ?.querySelector<HTMLElement>(`[data-person-id="${CSS.escape(previous)}"]`)
        ?.focus();
    }
  }, [selectedId]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{index.family.meta.title}, en lista</h2>
          <p className={styles.lead}>{lead}</p>
        </div>
        {action}
      </header>
      <div className={styles.body} data-selected={selected !== undefined}>
        <nav ref={list} className={styles.list} aria-label="Árbol de la familia">
          <ul className={styles.tree}>
            <li>
              <CoupleEntry union={outline} />
            </li>
          </ul>
        </nav>
        <section
          ref={card}
          className={styles.card}
          tabIndex={-1}
          aria-label={selected ? `Ficha de ${fullName(selected)}` : 'Ficha'}
        >
          {selected ? (
            <PersonCard
              key={selected.id}
              person={selected}
              layout="side"
              sheetSize="full"
              onToggleSize={() => undefined}
              onClose={() => {
                selectPerson(null);
              }}
              grip={undefined}
              embedded
            />
          ) : (
            <p className={styles.empty}>Elige a alguien de la lista para ver su ficha.</p>
          )}
        </section>
      </div>
    </div>
  );
}
