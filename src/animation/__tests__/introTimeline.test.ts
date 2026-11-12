import gsap from 'gsap';
import { describe, expect, it, vi } from 'vitest';
import { introTimeline, type IntroTiming } from '../introTimeline';

const timing: IntroTiming = {
  fall: 1.7,
  sink: 0.5,
  sproutDelay: 0.15,
  growth: 5,
  pullDelay: 0.3,
  arriveEarly: 0.4,
};

function setup() {
  const camera = { value: 0 };
  const targets = {
    seedFall: { value: 0 },
    seedSink: { value: 0 },
    growth: { value: 1e6 },
    onLand: vi.fn(),
    pullBack: vi.fn((duration: number) => gsap.to(camera, { value: 1, duration })),
  };
  return { targets, camera, timeline: introTimeline(targets, timing) };
}

describe('introTimeline', () => {
  it('lasts the fall, the pause and the growth', () => {
    expect(setup().timeline.duration()).toBeCloseTo(1.7 + 0.15 + 5, 6);
  });

  it('hides the whole tree until the seed has landed', () => {
    const { targets, timeline } = setup();
    timeline.pause().seek(1);
    expect(targets.growth.value).toBeLessThan(0);
    expect(targets.seedFall.value).toBeGreaterThan(0);
    expect(targets.seedFall.value).toBeLessThan(1);
    expect(targets.onLand).not.toHaveBeenCalled();
  });

  it('lands, then grows one second of growth per second', () => {
    const { targets, timeline } = setup();
    // Played through, not jumped: callbacks fire on the way.
    timeline.pause().seek(1.7 + 0.15 + 2, false);
    expect(targets.onLand).toHaveBeenCalledOnce();
    expect(targets.growth.value).toBeCloseTo(2, 6);
  });

  it('ends fully grown, with the seed gone and the camera arrived', () => {
    const { targets, timeline, camera } = setup();
    timeline.progress(1);
    expect(targets.growth.value).toBe(5);
    expect(targets.seedSink.value).toBe(0);
    expect(camera.value).toBe(1);
    expect(targets.pullBack).toHaveBeenCalledWith(expect.closeTo(1.7 + 0.15 + 5 - 0.4 - 2, 6));
  });
});
