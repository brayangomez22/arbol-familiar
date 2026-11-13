import { useEffect, useSyncExternalStore } from 'react';
import { PERSON_PANEL } from '@/config/constants';
import { useAppStore } from '@/state/store';

export type PanelLayout = 'side' | 'sheet';

const QUERY = `(max-width: ${PERSON_PANEL.sheetMaxWidth}px)`;

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => {
    media.removeEventListener('change', onChange);
  };
}

function getSnapshot(): PanelLayout {
  return window.matchMedia(QUERY).matches ? 'sheet' : 'side';
}

/**
 * A column on the right on wide screens, a bottom sheet on phones. Also tells the scene how much
 * of the view the panel covers, so flights frame the person beside it rather than behind it.
 */
export function usePanelLayout(): PanelLayout {
  const layout = useSyncExternalStore(subscribe, getSnapshot);
  const setViewInset = useAppStore((state) => state.setViewInset);

  useEffect(() => {
    const update = () => {
      setViewInset(
        layout === 'side'
          ? { right: PERSON_PANEL.width + 2 * PERSON_PANEL.margin, bottom: 0 }
          : { right: 0, bottom: Math.round(PERSON_PANEL.sheetPeek * window.innerHeight) },
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [layout, setViewInset]);

  return layout;
}
