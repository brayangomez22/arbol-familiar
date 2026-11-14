import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';
import { useAppStore } from '@/state/store';

/** Hands drei's count of loaded files to the loading screen, which lives in the UI. */
export function LoadProgressReporter() {
  const { active, progress } = useProgress();
  const setAssetProgress = useAppStore((state) => state.setAssetProgress);
  useEffect(() => {
    // Nothing loading and nothing loaded yet means there was nothing to load.
    setAssetProgress(active ? progress / 100 : 1);
  }, [active, progress, setAssetProgress]);
  return null;
}
