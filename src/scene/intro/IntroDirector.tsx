import { CameraControlsImpl } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { flyCamera, type CameraPose } from '@/animation/cameraFly';
import { BEFORE_SPROUT, introTimeline, type IntroTiming } from '@/animation/introTimeline';
import { CAMERA, INTRO, INTRO_DUST, NAVIGATION } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { GrowthSchedule } from '@/layout/growth';
import type { TreeLayout } from '@/layout/types';
import { vec3 } from '@/layout/vec';
import { hasSeenIntro, rememberIntroSeen } from '@/state/introMemory';
import { useAppStore } from '@/state/store';
import { livePalette } from '../ambient/livePalette';
import { frameBounds } from '../camera/frameBounds';
import { SparkBurst, type SparkBurstHandle } from '../tree/SparkBurst';
import { FULLY_GROWN, growthUniforms } from './growthUniforms';
import { Seed, type SeedMotion } from './Seed';

interface IntroDirectorProps {
  readonly layout: TreeLayout;
  readonly schedule: GrowthSchedule;
}

/**
 * Plays the opening once per visitor: seed, shoot, the tree growing generation by generation and
 * the camera pulling back to frame it. Without it (seen before, or reduced motion) the tree is
 * simply complete. The UI's "Saltar" sets the phase to done, which jumps to the end, and its
 * "Ver la intro de nuevo" sets it back to playing, which starts over from the seed.
 */
export function IntroDirector({ layout, schedule }: IntroDirectorProps) {
  const controls = useThree((state) => state.controls);
  const getState = useThree((state) => state.get);
  const reducedMotion = useReducedMotion();
  // Not read inside the effect: a new value only has to run it again.
  const replays = useAppStore((state) => state.introReplays);
  const seedMotion = useRef<SeedMotion>({ fall: { value: 0 }, sink: { value: 0 } });
  const dust = useRef<SparkBurstHandle>(null);
  const ground = useMemo(() => {
    const base = layout.branches.find((branch) => branch.kind === 'trunk')?.points[0];
    return vec3(base?.x ?? 0, 0, base?.z ?? 0);
  }, [layout.branches]);

  // A layout effect, so the tree is hidden before the first frame is ever drawn.
  useLayoutEffect(() => {
    const store = useAppStore.getState();
    const motion = seedMotion.current;
    const showComplete = () => {
      growthUniforms.uGrowth.value = FULLY_GROWN;
      motion.sink.value = 0;
      // Skipping already set it from the UI.
      if (useAppStore.getState().introPhase !== 'done')
        useAppStore.getState().setIntroPhase('done');
    };
    // Played to the end or skipped: either way, seen.
    const finish = () => {
      rememberIntroSeen();
      showComplete();
    };
    // Already playing means a replay was asked for, even though it has been seen.
    const seen = hasSeenIntro() && store.introPhase !== 'playing';
    if (reducedMotion || seen || store.introPhase === 'done') {
      showComplete();
      return;
    }
    store.setIntroPhase('playing');

    const cameraControls = controls instanceof CameraControlsImpl ? controls : null;
    const { size } = getState();
    const framing = frameBounds(
      layout.bounds,
      CAMERA.fov,
      size.width / size.height,
      NAVIGATION.framingMargin,
    );
    const { camera } = INTRO;
    const lookAt = { x: ground.x, y: ground.y + camera.startLift, z: ground.z };
    const start: CameraPose = {
      target: lookAt,
      position: { ...lookAt, z: lookAt.z + camera.startDistance },
    };
    const end: CameraPose = {
      target: { x: framing.target[0], y: framing.target[1], z: framing.target[2] },
      position: { x: framing.position[0], y: framing.position[1], z: framing.position[2] },
    };
    const apply = ({ position, target }: CameraPose) => {
      void cameraControls?.setLookAt(
        position.x,
        position.y,
        position.z,
        target.x,
        target.y,
        target.z,
        false,
      );
    };
    apply(start);

    let pull: gsap.core.Tween | null = null;
    const timing: IntroTiming = {
      fall: INTRO.seed.fallDuration,
      sink: INTRO.seed.sinkDuration,
      sproutDelay: INTRO.sproutDelay,
      // Until the last partner has popped and the last leaf has opened.
      growth:
        schedule.end +
        Math.max(
          INTRO.fruit.graftDelay,
          INTRO.leaves.spread + INTRO.leaves.unfold,
          INTRO.growth.swell,
        ),
      pullDelay: camera.pullDelay,
      arriveEarly: camera.arriveEarly,
    };
    const timeline = introTimeline(
      {
        seedFall: motion.fall,
        seedSink: motion.sink,
        growth: growthUniforms.uGrowth,
        onLand: () => {
          dust.current?.emit('seed', ground, 1);
        },
        pullBack: (duration) => {
          if (!cameraControls) return null;
          pull = flyCamera(start, end, { duration, pullBack: 0 }, apply);
          return pull;
        },
      },
      timing,
    );
    timeline.eventCallback('onComplete', finish);

    // Start only once every shader is compiled (also of fruits still out of view): compiling
    // mid-intro would freeze a frame while the timeline's clock runs on, and the seed would jump.
    timeline.pause();
    motion.fall.value = 0;
    motion.sink.value = 1;
    growthUniforms.uGrowth.value = BEFORE_SPROUT;
    let cancelled = false;
    let warmUp = 0;
    const { gl, scene, camera: viewCamera } = getState();
    const startWhenWarm = () => {
      if (cancelled) return;
      if (warmUp++ < INTRO.warmUpFrames) {
        requestAnimationFrame(startWhenWarm);
        return;
      }
      timeline.play();
    };
    void gl.compileAsync(scene, viewCamera).then(startWhenWarm);

    // Taking the camera (drag, zoom) stops only the pull back; the tree keeps growing.
    const releaseCamera = () => {
      pull?.kill();
    };
    cameraControls?.addEventListener('controlstart', releaseCamera);
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.cameraRequest !== previous.cameraRequest) releaseCamera();
      if (state.introPhase === 'done' && previous.introPhase !== 'done') {
        // Skipped: jump to the final picture.
        timeline.progress(1);
        finish();
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
      cameraControls?.removeEventListener('controlstart', releaseCamera);
      timeline.kill();
    };
  }, [controls, getState, reducedMotion, layout.bounds, ground, schedule, replays]);

  return (
    <>
      <Seed motion={seedMotion} ground={ground} />
      <SparkBurst ref={dust} config={INTRO_DUST} color={livePalette.dust} />
    </>
  );
}
