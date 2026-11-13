import { AUDIO } from '@/config/constants';

/**
 * Whether the visitor left the sound on. Storage can be missing or throw (private mode, blocked
 * cookies): then the sound simply starts off, never an error.
 */
export function loadAudioPreference(): boolean {
  try {
    return window.localStorage.getItem(AUDIO.storageKey) === 'on';
  } catch {
    return false;
  }
}

export function saveAudioPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(AUDIO.storageKey, enabled ? 'on' : 'off');
  } catch {
    // Nothing to do: next visit starts silent.
  }
}
