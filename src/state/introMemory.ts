import { INTRO } from '@/config/constants';

/**
 * Whether this visitor has already seen the intro. Storage can be missing or throw (private mode,
 * blocked cookies): then it is simply played again, never an error.
 */
export function hasSeenIntro(): boolean {
  try {
    return window.localStorage.getItem(INTRO.storageKey) !== null;
  } catch {
    return false;
  }
}

export function rememberIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO.storageKey, new Date().toISOString());
  } catch {
    // Nothing to do: next visit plays it again.
  }
}
