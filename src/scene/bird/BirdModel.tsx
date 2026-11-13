import { Outlines } from '@react-three/drei';
import { useEffect, useMemo, type Ref } from 'react';
import { Color, ConeGeometry, CylinderGeometry, SphereGeometry, type Group } from 'three';
import { TOON } from '@/config/constants';
import { birdPalette, dayPalette } from '@/config/theme';
import { livePalette } from '../ambient/livePalette';
import { ToonMaterial } from '../materials/ToonMaterial';

export interface BirdParts {
  readonly head: Ref<Group>;
  readonly leftWing: Ref<Group>;
  readonly rightWing: Ref<Group>;
  readonly tail: Ref<Group>;
}

/**
 * A round little bluebird in the toon style of the fruits, about a unit long, looking toward +x
 * with its feet at the origin. Wings, head and tail are groups so the flight can move them.
 */
export function BirdModel({ head, leftWing, rightWing, tail }: BirdParts) {
  const parts = useMemo(() => {
    const material = (color: string) =>
      new ToonMaterial({ color: new Color(color), palette: livePalette, focus: true });
    return {
      sphere: new SphereGeometry(1, 20, 14),
      beakGeometry: new ConeGeometry(0.09, 0.3, 8),
      legGeometry: new CylinderGeometry(0.025, 0.025, 0.18, 5),
      back: material(birdPalette.back),
      breast: material(birdPalette.breast),
      beak: material(birdPalette.beak),
      eye: material(birdPalette.eye),
    };
  }, []);

  useEffect(
    () => () => {
      for (const part of Object.values(parts)) part.dispose();
    },
    [parts],
  );

  const outline = (
    <Outlines
      thickness={TOON.outline.fruitThickness}
      color={dayPalette.outline}
      toneMapped={false}
    />
  );

  return (
    <group position-y={0.56}>
      <mesh geometry={parts.sphere} material={parts.back} scale={[0.62, 0.46, 0.42]}>
        {outline}
      </mesh>
      {/* The warm breast, bulging out front and below. */}
      <mesh
        geometry={parts.sphere}
        material={parts.breast}
        position={[0.17, -0.1, 0]}
        scale={[0.42, 0.36, 0.38]}
      />
      <group ref={head} position={[0.46, 0.34, 0]}>
        <mesh geometry={parts.sphere} material={parts.back} scale={0.3}>
          {outline}
        </mesh>
        <mesh
          geometry={parts.beakGeometry}
          material={parts.beak}
          position={[0.34, -0.03, 0]}
          rotation-z={-Math.PI / 2}
        />
        <mesh
          geometry={parts.sphere}
          material={parts.eye}
          position={[0.15, 0.08, 0.24]}
          scale={0.05}
        />
        <mesh
          geometry={parts.sphere}
          material={parts.eye}
          position={[0.15, 0.08, -0.24]}
          scale={0.05}
        />
      </group>
      <group ref={tail} position={[-0.5, 0.06, 0]}>
        <mesh
          geometry={parts.sphere}
          material={parts.back}
          position={[-0.22, 0.08, 0]}
          rotation-z={-0.35}
          scale={[0.32, 0.06, 0.17]}
        />
      </group>
      {/* Pivots at the shoulders: the flight turns them about the body's long axis. */}
      <group ref={leftWing} position={[0, 0.12, 0.36]}>
        <mesh
          geometry={parts.sphere}
          material={parts.back}
          position={[-0.14, 0, 0.22]}
          scale={[0.34, 0.06, 0.25]}
        />
      </group>
      <group ref={rightWing} position={[0, 0.12, -0.36]}>
        <mesh
          geometry={parts.sphere}
          material={parts.back}
          position={[-0.14, 0, -0.22]}
          scale={[0.34, 0.06, 0.25]}
        />
      </group>
      <mesh geometry={parts.legGeometry} material={parts.beak} position={[0.06, -0.47, 0.1]} />
      <mesh geometry={parts.legGeometry} material={parts.beak} position={[0.06, -0.47, -0.1]} />
    </group>
  );
}
