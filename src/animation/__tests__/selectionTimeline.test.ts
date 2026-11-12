import { describe, expect, it, vi } from 'vitest';
import {
  releaseTimeline,
  selectTimeline,
  type SelectionTargets,
  type SelectionTiming,
} from '../selectionTimeline';

const timing: SelectionTiming = {
  sapDuration: 1.5,
  sapHead: 1,
  fadeOut: 0.2,
  focusDuration: 0.9,
  release: 0.7,
  reducedFade: 0.3,
};

const route = { limits: new Map([['trunk', 4]]), length: 20 };

function targets(intensity = 0) {
  return {
    sapFront: { value: 0 },
    sapIntensity: { value: intensity },
    focus: { value: 0 },
    showLineage: vi.fn<SelectionTargets['showLineage']>(),
  };
}

describe.each([false, true])('selectTimeline (reduced motion: %s)', (reduced) => {
  it('ends with the lineage lit past the tip and the tree in focus', () => {
    const t = targets();
    selectTimeline(t, route, timing, reduced).progress(1);
    expect(t.showLineage).toHaveBeenCalledWith(route.limits);
    expect(t.sapFront.value).toBe(22);
    expect(t.sapIntensity.value).toBe(1);
    expect(t.focus.value).toBe(1);
  });

  it('is shorter with reduced motion', () => {
    const duration = selectTimeline(targets(), route, timing, reduced).duration();
    if (reduced) expect(duration).toBeLessThanOrEqual(timing.reducedFade + 1e-9);
    else expect(duration).toBeCloseTo(timing.sapDuration, 6);
  });
});

describe('selectTimeline after another selection', () => {
  it('fades the old lineage out before swapping it', () => {
    const t = targets(1);
    const timeline = selectTimeline(t, route, timing, false);
    timeline.progress(0.5 * (timing.fadeOut / timeline.duration()));
    expect(t.sapIntensity.value).toBeGreaterThan(0);
    expect(t.sapIntensity.value).toBeLessThan(1);
    expect(t.showLineage).not.toHaveBeenCalled();
    timeline.progress(1);
    expect(t.showLineage).toHaveBeenCalledOnce();
  });
});

describe('releaseTimeline', () => {
  it('fades everything out and then clears the lineage', () => {
    const t = { ...targets(1), focus: { value: 1 } };
    releaseTimeline(t, timing, false).progress(1);
    expect(t.sapIntensity.value).toBe(0);
    expect(t.focus.value).toBe(0);
    expect(t.showLineage).toHaveBeenCalledWith(null);
  });
});
