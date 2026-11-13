import { useEffect, useId, useMemo, useState } from 'react';
import { SEARCH } from '@/config/constants';
import { searchPeople } from '@/domain/search';
import type { PersonId } from '@/domain/types';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { SearchOption } from './SearchOption';
import styles from './SearchPalette.module.css';

interface SearchPaletteProps {
  readonly onClose: () => void;
}

/**
 * Type a name or nickname, without worrying about accents; the arrows walk the results (the
 * highlighted one glows in the tree) and Enter flies to it.
 */
export function SearchPalette({ onClose }: SearchPaletteProps) {
  const { searchEntries } = useFamily();
  const selectPerson = useAppStore((state) => state.selectPerson);
  const hoverPerson = useAppStore((state) => state.hoverPerson);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [returnFocus] = useState(() => document.activeElement);
  const listId = useId();
  const results = useMemo(
    () => searchPeople(searchEntries, query, SEARCH.maxResults),
    [searchEntries, query],
  );
  const activeId = results[active]?.id;

  useEffect(() => {
    hoverPerson(activeId ?? null);
  }, [activeId, hoverPerson]);

  useEffect(
    () => () => {
      hoverPerson(null);
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
    },
    [hoverPerson, returnFocus],
  );

  const choose = (personId: PersonId) => {
    selectPerson(personId);
    onClose();
  };

  const trimmed = query.trim();
  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" onPointerDown={onClose} />
      <div className={styles.palette} role="dialog" aria-label="Buscar en la familia">
        <div className={styles.field}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="m20 20-4.5-4.5" />
          </svg>
          <input
            className={styles.input}
            // The palette exists only while open, so focusing on mount is what the visitor asked.
            autoFocus
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId === undefined ? undefined : `${listId}-${activeId}`}
            placeholder="Buscar por nombre o apodo"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (results.length === 0) return;
                const step = event.key === 'ArrowDown' ? 1 : -1;
                setActive((active + step + results.length) % results.length);
              } else if (event.key === 'Enter' && activeId !== undefined) {
                event.preventDefault();
                choose(activeId);
              }
            }}
          />
          <kbd className={styles.key}>Esc</kbd>
        </div>
        <ul id={listId} role="listbox" className={styles.results} aria-label="Resultados">
          {results.map((result, resultIndex) => (
            <SearchOption
              key={result.id}
              id={`${listId}-${result.id}`}
              personId={result.id}
              active={resultIndex === active}
              onChoose={() => {
                choose(result.id);
              }}
              onActivate={() => {
                setActive(resultIndex);
              }}
            />
          ))}
        </ul>
        {trimmed !== '' && results.length === 0 && (
          <p className={styles.message}>No encontramos a nadie llamado «{trimmed}».</p>
        )}
        {trimmed === '' && (
          <p className={styles.message}>Escribe un nombre o un apodo; las tildes dan igual.</p>
        )}
      </div>
    </>
  );
}
