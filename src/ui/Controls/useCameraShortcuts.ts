import { useEffect } from 'react';
import { useAppStore, type CameraAction } from '@/state/store';

const SHORTCUTS: Readonly<Record<string, CameraAction>> = {
  '0': 'frameAll',
  '+': 'zoomIn',
  '=': 'zoomIn',
  '-': 'zoomOut',
};

/** `0` frames the whole tree, `+` and `-` zoom. Ignored while typing or with modifiers held. */
export function useCameraShortcuts(): void {
  const requestCamera = useAppStore((state) => state.requestCamera);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + 0, + and - are the browser's own page zoom.
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      const action = SHORTCUTS[event.key];
      if (!action) return;
      event.preventDefault();
      requestCamera(action);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [requestCamera]);
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
