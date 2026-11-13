import { useEffect } from 'react';
import type { Direction } from '@/domain/navigation';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { shouldIgnoreShortcut } from '../keyboard';

const ARROWS: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** With someone selected: Escape closes their panel, arrows move to parents, children and siblings. */
export function usePersonShortcuts(enabled: boolean): void {
  const { relativeInDirection } = useFamily();

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;
      const { selectedPersonId, selectPerson } = useAppStore.getState();
      if (selectedPersonId === null) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        selectPerson(null);
        return;
      }
      const direction = ARROWS[event.key];
      if (!direction) return;
      event.preventDefault();
      const next = relativeInDirection(selectedPersonId, direction);
      if (next !== undefined) selectPerson(next);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, relativeInDirection]);
}
