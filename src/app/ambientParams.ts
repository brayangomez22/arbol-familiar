import { useEffect } from 'react';
import { parseDayPhase, type DayPhase } from '@/domain/dayCycle';
import { parseSeason, type Season } from '@/domain/seasons';
import { useAppStore } from '@/state/store';

export interface AmbientParams {
  readonly season: Season | null;
  readonly dayPhase: DayPhase | null;
}

const SEASON_PARAM = 'season';
const TIME_PARAM = 'time';

/** `?season=otoño&time=noche`: either can be missing (or unknown), and then follows the clock. */
export function readAmbientParams(search: string): AmbientParams {
  const params = new URLSearchParams(search);
  return {
    season: parseSeason(params.get(SEASON_PARAM)),
    dayPhase: parseDayPhase(params.get(TIME_PARAM)),
  };
}

/** Whether the address asks for the hidden season and time picker (it names either parameter). */
export function wantsAmbientPicker(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has(SEASON_PARAM) || params.has(TIME_PARAM);
}

/** The address with the forced season and time in its query; the hash stays as it is. */
export function urlForAmbient(href: string, { season, dayPhase }: AmbientParams): string {
  const url = new URL(href);
  // Kept even when following the clock, so the picker is still there after a reload.
  url.searchParams.set(SEASON_PARAM, season ?? 'auto');
  url.searchParams.set(TIME_PARAM, dayPhase ?? 'auto');
  return url.href;
}

/**
 * Applies `?season=` and `?time=` to the store. Called before the first render, so a forced
 * night is night from the first frame instead of fading in from the clock's look.
 */
export function applyAmbientParams(search: string): void {
  const { season, dayPhase } = readAmbientParams(search);
  const store = useAppStore.getState();
  store.setSeasonOverride(season);
  store.setDayPhaseOverride(dayPhase);
}

/** Writes the hidden picker's choices back to the address, so a forced look can be shared. */
export function useAmbientParamsSync(): void {
  useEffect(() => {
    if (!wantsAmbientPicker(window.location.search)) return;

    return useAppStore.subscribe((state, previous) => {
      if (
        state.seasonOverride === previous.seasonOverride &&
        state.dayPhaseOverride === previous.dayPhaseOverride
      )
        return;
      const next = urlForAmbient(window.location.href, {
        season: state.seasonOverride,
        dayPhase: state.dayPhaseOverride,
      });
      if (next !== window.location.href) window.history.replaceState(null, '', next);
    });
  }, []);
}
