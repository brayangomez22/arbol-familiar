import { DAY_CYCLE } from '@/config/constants';
import { dayBlendAt, hourOf, steadyBlend, type DayBlend } from '@/domain/dayCycle';
import { seasonOf, type Season } from '@/domain/seasons';
import { useAppStore } from '@/state/store';
import { useNow } from './useNow';

/** The season the tree shows: forced from the URL, or the one of today's month. */
export function useSeason(): Season {
  const now = useNow(DAY_CYCLE.clockInterval);
  const forced = useAppStore((state) => state.seasonOverride);
  return forced ?? seasonOf(now);
}

/** The light of the hour: forced from the URL, or the visitor's local time. */
export function useDayBlend(): DayBlend {
  const now = useNow(DAY_CYCLE.clockInterval);
  const forced = useAppStore((state) => state.dayPhaseOverride);
  return forced ? steadyBlend(forced) : dayBlendAt(hourOf(now), DAY_CYCLE.stops);
}
