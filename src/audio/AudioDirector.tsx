import { useEffect } from 'react';
import { useAppStore } from '@/state/store';
import { AmbientAudio } from './AmbientAudio';
import { mixTargets, popFrequency } from './audioMix';

/** Gestures that let a page start sound in every browser (touchend for older iOS). */
const GESTURES = ['click', 'keydown', 'touchend'] as const;

function currentTargets() {
  const { audioEnabled, voiceNotePlaying } = useAppStore.getState();
  return mixTargets({
    enabled: audioEnabled,
    voiceNotePlaying,
    pageVisible: document.visibilityState === 'visible',
  });
}

/**
 * Plays the ambient sound as the store says: on or off with the speaker button, ducked under a
 * voice note, silent in a background tab, and a pop on choosing someone. Renders nothing.
 */
export function AudioDirector() {
  useEffect(() => {
    // Made here rather than kept across renders: each mount owns its graph and closes it.
    const audio = new AmbientAudio();
    // Listening on window, after React has handled the event: the click that turns the sound on
    // has already set the store when this runs, still inside the gesture.
    const unlockOnGesture = () => {
      if (!useAppStore.getState().audioEnabled) return;
      audio.unlock();
      for (const gesture of GESTURES) window.removeEventListener(gesture, unlockOnGesture);
    };
    for (const gesture of GESTURES) window.addEventListener(gesture, unlockOnGesture);

    const remix = () => {
      audio.apply(currentTargets());
    };
    document.addEventListener('visibilitychange', remix);

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (
        state.audioEnabled !== previous.audioEnabled ||
        state.voiceNotePlaying !== previous.voiceNotePlaying
      ) {
        remix();
      }
      const chosen = state.selectedPersonId;
      if (chosen !== null && chosen !== previous.selectedPersonId) audio.pop(popFrequency(chosen));
    });

    return () => {
      for (const gesture of GESTURES) window.removeEventListener(gesture, unlockOnGesture);
      document.removeEventListener('visibilitychange', remix);
      unsubscribe();
      audio.dispose();
    };
  }, []);

  return null;
}
