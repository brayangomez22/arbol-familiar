import { useEffect } from 'react';
import { TIMELINE } from '@/config/constants';
import type { TimelineRange } from '@/domain/timeline';
import { useAppStore } from '@/state/store';

/**
 * While ▶ plays, moves the timeline one year at a time. Starting from today (or the last year)
 * starts over from the first; reaching the last year comes back to today and stops.
 */
export function useTimelinePlayback({ first, last }: TimelineRange): void {
  const playing = useAppStore((state) => state.timelinePlaying);

  useEffect(() => {
    if (!playing) return;
    const { timelineYear, setTimelineYear } = useAppStore.getState();
    if (timelineYear === null || timelineYear >= last) setTimelineYear(first);

    const timer = window.setInterval(() => {
      const state = useAppStore.getState();
      const next = (state.timelineYear ?? first) + 1;
      if (next >= last) {
        state.setTimelineYear(null);
        state.setTimelinePlaying(false);
        return;
      }
      state.setTimelineYear(next);
    }, TIMELINE.playStepMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing, first, last]);
}
