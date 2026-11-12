import { Outlines } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { SphereGeometry, type Mesh } from 'three';
import type { Animated } from '@/animation/selectionTimeline';
import { INTRO, TOON } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { Vec3 } from '@/layout/types';
import { ToonMaterial } from '../materials/ToonMaterial';

export interface SeedMotion {
  /** 0 → 1 as it falls. */
  readonly fall: Animated;
  /** 1 while on the ground, → 0 as it sinks in. 0 hides it (no intro). */
  readonly sink: Animated;
}

interface SeedProps {
  /** Driven by the intro timeline; read every frame. */
  readonly motion: RefObject<SeedMotion>;
  /** Where it lands: the hilltop under the trunk. */
  readonly ground: Vec3;
}

/** Elongation of the seed along its length: an almond, not a ball. */
const SEED_SHAPE = [0.75, 1, 0.75] as const;

/** The seed the tree grows from: falls like a leaf, swinging less as it nears the ground. */
export function Seed({ motion, ground }: SeedProps) {
  const geometry = useMemo(() => {
    const sphere = new SphereGeometry(1, 20, 14);
    sphere.scale(...SEED_SHAPE);
    return sphere;
  }, []);
  const material = useMemo(
    () => new ToonMaterial({ color: dayPalette.trunk, palette: dayPalette }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const seed = mesh.current;
    if (!seed) return;
    const { size, startHeight, swayAmplitude, swayTurns, swayTilt } = INTRO.seed;
    const fall = motion.current.fall.value;
    const sink = motion.current.sink.value;
    const swing = Math.sin(fall * Math.PI * 2 * swayTurns);
    const calm = 1 - fall;
    seed.position.set(
      ground.x + swayAmplitude * swing * calm,
      ground.y + size + startHeight * calm - size * 2 * (1 - sink),
      ground.z,
    );
    seed.rotation.z = swayTilt * Math.cos(fall * Math.PI * 2 * swayTurns) * calm;
    seed.scale.setScalar(size * sink);
  });

  return (
    // Never `visible={false}`: three would only compile its shader when it first shows up, a
    // stutter mid-intro. Scale 0 hides it instead.
    <mesh ref={mesh} geometry={geometry} material={material} scale={0}>
      <Outlines
        thickness={TOON.outline.fruitThickness}
        color={dayPalette.outline}
        toneMapped={false}
      />
    </mesh>
  );
}
