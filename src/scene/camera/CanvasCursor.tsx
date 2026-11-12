import { CameraControlsImpl } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useAppStore } from '@/state/store';

/** Open hand over the canvas, closed while dragging, pointer over a fruit. */
export function CanvasCursor() {
  const get = useThree((state) => state.get);
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!(controls instanceof CameraControlsImpl)) return;
    const element = get().gl.domElement;
    let dragging = false;
    const apply = () => {
      const hovering = useAppStore.getState().hoveredPersonId !== null;
      element.style.cursor = dragging ? 'grabbing' : hovering ? 'pointer' : 'grab';
    };
    const handleStart = () => {
      dragging = true;
      apply();
    };
    const handleEnd = () => {
      dragging = false;
      apply();
    };

    controls.addEventListener('controlstart', handleStart);
    controls.addEventListener('controlend', handleEnd);
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.hoveredPersonId !== previous.hoveredPersonId) apply();
    });
    apply();
    return () => {
      controls.removeEventListener('controlstart', handleStart);
      controls.removeEventListener('controlend', handleEnd);
      unsubscribe();
      element.style.cursor = '';
    };
  }, [get, controls]);

  return null;
}
