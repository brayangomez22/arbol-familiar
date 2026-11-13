import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type Group } from 'three';
import { BIRD, WIND } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { birdPerches } from '@/layout/birdPerches';
import { createRandom } from '@/layout/random';
import { swayWeight, type TreeReach } from '@/layout/reach';
import type { TreeLayout } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { windSway } from '../wind/windField';
import { windFrame } from '../wind/windUniforms';
import { initialBird, stepBird, type BirdState, type BirdTiming } from './birdBehavior';
import { BirdModel } from './BirdModel';

interface BirdProps {
  readonly layout: TreeLayout;
  readonly reach: TreeReach;
}

/** Wings tucked along the sides, as a fraction of a quarter turn about the body's axis. */
const FOLDED = 1.35;
/** Turned a little toward the viewer, so it reads in three quarters rather than flat profile. */
const TOWARD_VIEWER = 0.4;

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Point `t` of the quadratic Bézier a → c → b, written into `out`. */
function bezier(out: Vector3, a: Vector3, c: Vector3, b: Vector3, t: number): Vector3 {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
}

/** The canvas's own cursor, as CanvasCursor sets it for fruits and dragging. */
function setCursor(event: ThreeEvent<PointerEvent>, cursor: string): void {
  const canvas = event.nativeEvent.target;
  if (canvas instanceof HTMLElement) canvas.style.cursor = cursor;
}

/**
 * Now and then a bird flies in, perches on a level stretch of some branch, bobs its head and hops
 * round, swaying with the branch in the wind; touched, it flies off. Only on today's tree, after
 * the intro. With reduced motion it does not fly: it fades in and out on its perch.
 */
export function Bird({ layout, reach }: BirdProps) {
  const perches = useMemo(
    () => birdPerches(layout.branches, layout.fruits, layout.leafClusters, BIRD.perch),
    [layout.branches, layout.fruits, layout.leafClusters],
  );
  const weights = useMemo(
    () =>
      perches.map((perch) =>
        swayWeight(reach.atFraction(perch.branchId, perch.t), reach.max, WIND.weightExponent),
      ),
    [perches, reach],
  );
  const reducedMotion = useReducedMotion();
  const timing = useMemo<BirdTiming>(
    () => ({
      ...BIRD,
      arrive: reducedMotion ? BIRD.fade : BIRD.arrive,
      leave: reducedMotion ? BIRD.fade : BIRD.leave,
    }),
    [reducedMotion],
  );
  const random = useMemo(() => createRandom('bird'), []);
  const state = useRef<BirdState>(initialBird(random, timing));
  const scared = useRef(false);
  const hop = useRef({ next: random.range(...BIRD.hopEvery), elapsed: -1 });
  const facing = useRef<1 | -1>(1);

  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftWing = useRef<Group>(null);
  const rightWing = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const scratch = useMemo(
    () => ({
      perch: new Vector3(),
      sway: new Vector3(),
      far: new Vector3(),
      control: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const bird = root.current;
    if (!bird) return;
    const { introPhase, timelineYear } = useAppStore.getState();
    const previous = state.current;
    const next = stepBird(
      previous,
      delta,
      {
        canVisit: introPhase === 'done' && timelineYear === null,
        perchCount: perches.length,
        scared: scared.current,
      },
      random,
      timing,
    );
    scared.current = false;
    state.current = next;
    if (next.phase === 'arriving' && previous.phase !== 'arriving') facing.current = next.facing;

    const perch = perches[next.perch];
    const weight = weights[next.perch] ?? 0;
    if (next.phase === 'away' || !perch) {
      bird.scale.setScalar(0);
      return;
    }

    // The perch moves with its branch, so the bird rides the wind with it.
    const { perch: seat, sway, far, control } = scratch;
    seat.set(perch.position.x, perch.position.y, perch.position.z);
    seat.add(windSway(perch.position, weight, windFrame, sway));

    const time = clock.elapsedTime;
    const progress = Math.min(1, next.elapsed / next.duration);
    let flying = false;
    let scale = BIRD.size;
    const [side, up, toward] = BIRD.flight;

    if (next.phase === 'perched') {
      bird.position.copy(seat);
      // Now and then a little hop that turns it round.
      const hopping = hop.current;
      if (hopping.elapsed >= 0) {
        hopping.elapsed += delta;
        const jump = Math.min(1, hopping.elapsed / BIRD.hopDuration);
        bird.position.y += Math.sin(jump * Math.PI) * BIRD.hopHeight;
        if (jump >= 0.5 && facing.current === next.facing) facing.current = -next.facing as 1 | -1;
        if (jump >= 1) hopping.elapsed = -1;
      } else if ((hopping.next -= delta) <= 0 && !reducedMotion) {
        hopping.next = random.range(...BIRD.hopEvery);
        hopping.elapsed = 0;
        state.current = { ...next, facing: facing.current };
      }
    } else if (reducedMotion) {
      bird.position.copy(seat);
      scale *= next.phase === 'arriving' ? progress : 1 - progress;
    } else {
      flying = true;
      const direction = facing.current;
      if (next.phase === 'arriving') {
        far.set(seat.x - direction * side, seat.y + up, seat.z + toward);
        control.lerpVectors(far, seat, 0.5).setY(Math.max(far.y, seat.y) + BIRD.arc);
        bezier(bird.position, far, control, seat, easeOut(progress));
      } else {
        far.set(seat.x + direction * side, seat.y + up, seat.z + toward);
        control.lerpVectors(seat, far, 0.5).setY(seat.y + BIRD.arc);
        bezier(bird.position, seat, control, far, progress * progress);
      }
    }

    bird.scale.setScalar(scale);
    bird.rotation.y = facing.current === 1 ? -TOWARD_VIEWER : Math.PI + TOWARD_VIEWER;

    // Wings beat in flight and settle on landing; folded when perched.
    const landing = next.phase === 'arriving' ? Math.max(0, (progress - 0.85) / 0.15) : 0;
    const beat = flying ? Math.sin(time * BIRD.flapRate) * BIRD.flapAngle * (1 - landing) : 0;
    const fold = flying ? landing * FOLDED : FOLDED;
    if (leftWing.current) leftWing.current.rotation.x = fold - beat;
    if (rightWing.current) rightWing.current.rotation.x = -fold + beat;
    if (head.current)
      head.current.rotation.z = flying || reducedMotion ? 0 : 0.18 * Math.sin(time * BIRD.bobRate);
    if (tail.current) tail.current.rotation.z = flying ? 0.2 * Math.sin(time * BIRD.flapRate) : 0;
  });

  const perchedNow = () => state.current.phase === 'perched';

  return (
    // Scale 0 rather than `visible={false}`: it is drawn, so compiled, from the start, and its
    // first visit does not stutter.
    <group ref={root} scale={0}>
      <BirdModel head={head} leftWing={leftWing} rightWing={rightWing} tail={tail} />
      {/* A generous, invisible target: the bird itself is small for a finger. */}
      <mesh
        position-y={0.5}
        scale={1.4}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          if (!perchedNow()) return;
          event.stopPropagation();
          scared.current = true;
        }}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          if (!perchedNow()) return;
          event.stopPropagation();
          setCursor(event, 'pointer');
        }}
        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
          setCursor(event, 'grab');
        }}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}
