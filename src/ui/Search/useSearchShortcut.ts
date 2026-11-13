import { useEffect } from 'react';
import { shouldIgnoreShortcut } from '../keyboard';

/** `/` opens the search, as on many sites; Ctrl/Cmd + K too. */
export function useSearchShortcut(enabled: boolean, onOpen: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const commandK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (!commandK && (event.key !== '/' || shouldIgnoreShortcut(event))) return;
      // Also keeps Firefox's quick find from opening.
      event.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onOpen]);
}
