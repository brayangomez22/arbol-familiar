import { useFrame } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { TIMELINE } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppStore } from '@/state/store';
import { damp } from '../damp';
import { growthUniforms } from '../intro/growthUniforms';
import type { FamilyTime } from './familyTime';

interface TimelineDirectorProps {
  readonly time: FamilyTime;
}

/**
 * Moves the tree to the year picked on the timeline: branches grow or fold back and fruits come
 * and go as uTimelineYear follows it. "Today" is late enough for every branch to be fully grown.
 */
export function TimelineDirector({ time }: TimelineDirectorProps) {
  const reducedMotion = useReducedMotion();
  const today = time.range.last + TIMELINE.growYears;

  useLayoutEffect(() => {
    growthUniforms.uTimelineYear.value = shownYear(useAppStore.getState().timelineYear, today);
  }, [today]);

  useFrame((_, delta) => {
    const target = shownYear(useAppStore.getState().timelineYear, today);
    const uniform = growthUniforms.uTimelineYear;
    uniform.value = reducedMotion
      ? target
      : damp(uniform.value, target, TIMELINE.followRate, delta);
  });

  return null;
}

function shownYear(year: number | null, today: number): number {
  return year === null ? today : year + TIMELINE.yearProgress;
}
