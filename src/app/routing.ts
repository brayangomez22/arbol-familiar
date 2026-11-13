import { useEffect } from 'react';
import type { PersonId } from '@/domain/types';
import { useAppStore } from '@/state/store';

/** The person a hash like "#ana-alvarez" points to, if they are in the family. */
export function personIdFromHash(hash: string, isPerson: (id: string) => boolean): PersonId | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  let id: string;
  try {
    id = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return null;
  }
  return id !== '' && isPerson(id) ? id : null;
}

/** The address of the page with the person in its hash, or without any hash for nobody. */
export function urlForPerson(href: string, id: PersonId | null): string {
  const url = new URL(href);
  url.hash = id ?? '';
  // An empty hash still leaves a bare "#" behind.
  return id === null ? url.href.replace(/#$/, '') : url.href;
}

/**
 * Keeps the selected person and `location.hash` in step, so every person has a link. A link opened
 * from outside waits for the intro (or its absence) before flying to the person.
 */
export function useHashSelection(isPerson: (id: string) => boolean): void {
  useEffect(() => {
    const store = useAppStore;
    // Before the intro is over, a hash is only remembered: the intro owns the camera until then.
    let pending = personIdFromHash(window.location.hash, isPerson);

    const writeHash = (id: PersonId | null) => {
      const next = urlForPerson(window.location.href, id);
      // replaceState: walking the tree should not fill the back button with every fruit visited.
      if (next !== window.location.href) window.history.replaceState(null, '', next);
    };

    const applyPending = () => {
      if (pending === null || store.getState().introPhase !== 'done') return;
      const id = pending;
      pending = null;
      store.getState().selectPerson(id);
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.introPhase !== previous.introPhase) applyPending();
      if (state.selectedPersonId !== previous.selectedPersonId) writeHash(state.selectedPersonId);
    });

    const handleHashChange = () => {
      const id = personIdFromHash(window.location.hash, isPerson);
      if (store.getState().introPhase === 'done') store.getState().selectPerson(id);
      else pending = id;
    };
    window.addEventListener('hashchange', handleHashChange);
    applyPending();

    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isPerson]);
}
