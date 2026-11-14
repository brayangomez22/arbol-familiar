import { useEffect, useState } from 'react';
import { useAppStore } from '@/state/store';
import { dismissBootLoader, showBootProgress } from './bootLoader';
import { loadingProgress } from './loadingProgress';

/**
 * Drives the seed that beats in index.html: fills its bar with the real load (code, fonts, files,
 * shaders) and fades it out the moment the scene draws its first real frame, which is when the
 * intro's seed starts to fall. No markup of its own: the screen is already there.
 */
export function BootLoader() {
  const assetProgress = useAppStore((state) => state.assetProgress);
  const sceneReady = useAppStore((state) => state.sceneReady);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    showBootProgress(loadingProgress({ fontsReady, assetProgress, sceneReady }));
  }, [fontsReady, assetProgress, sceneReady]);

  useEffect(() => {
    if (sceneReady) dismissBootLoader(true);
  }, [sceneReady]);

  return null;
}
