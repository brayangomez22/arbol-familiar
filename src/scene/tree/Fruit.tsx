import { Outlines } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { Vector3, type BufferGeometry, type Group, type Material } from 'three';
import { FRUIT_LABEL, FRUIT_MESH, NAVIGATION, TOON, WIND } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { FruitPlacement, Vec3 } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { damp } from '../damp';
import type { HaloMaterial } from '../materials/HaloMaterial';
import type { ToonMaterial } from '../materials/ToonMaterial';
import { stepSpring, type SpringState } from '../spring';
import { growthUniforms } from '../intro/growthUniforms';
import { windSway } from '../wind/windField';
import { windFrame } from '../wind/windUniforms';
import { FruitLabel } from './FruitLabel';
import type { LabelAlign } from './labelAlignment';

/** Geometries and materials shared by every fruit (owned and disposed by Fruits). */
export interface FruitResources {
  readonly bodyGeometry: BufferGeometry;
  readonly bodyMaterial: ToonMaterial;
  readonly capGeometry: BufferGeometry;
  readonly capMaterial: ToonMaterial;
  readonly haloGeometry: BufferGeometry;
  readonly haloMaterial: HaloMaterial;
  readonly labelMaterial: Material;
}

interface FruitProps {
  readonly fruit: FruitPlacement;
  readonly resources: FruitResources;
  readonly label: string;
  readonly labelAlign: LabelAlign;
  readonly alwaysLabeled: boolean;
  /** Point whose wind sway the fruit follows (its branch tip), and that point's wind weight. */
  readonly swayAnchor: Vec3;
  readonly swayWeight: number;
  /** Growth time (seconds) at which it pops in the intro. */
  readonly bornAt: number;
}

// The halo is decoration: it must never catch the pointer meant for a fruit behind it.
const ignoreRaycast = () => null;

/**
 * One person as a hanging lantern: hover grows it, a click (not a drag) selects it. It rides the
 * wind with its branch tip, so its name and its click area move with it.
 */
export function Fruit({
  fruit,
  resources,
  label,
  labelAlign,
  alwaysLabeled,
  swayAnchor,
  swayWeight,
  bornAt,
}: FruitProps) {
  const { personId, position, size } = fruit;
  const holder = useRef<Group>(null);
  const lantern = useRef<Group>(null);
  const sway = useMemo(() => new Vector3(), []);
  const scale = useRef<SpringState>({ value: size, velocity: 0 });
  const glow = useRef(0);
  // The halo material is shared: each fruit sets its own glow right before its halo is drawn.
  const { haloMaterial, bodyMaterial, capMaterial } = resources;
  const applyGlow = useMemo(
    () => () => {
      haloMaterial.setGlow(glow.current);
    },
    [haloMaterial],
  );

  const highlighted = useAppStore(
    (state) => state.hoveredPersonId === personId || state.selectedPersonId === personId,
  );
  const selected = useAppStore((state) => state.selectedPersonId === personId);
  // Fruit materials are shared too: only the selected one stays in color when the tree steps back.
  const applyBodyFocus = useMemo(
    () => () => {
      bodyMaterial.setFocused(selected ? 1 : 0);
    },
    [bodyMaterial, selected],
  );
  const applyCapFocus = useMemo(
    () => () => {
      capMaterial.setFocused(selected ? 1 : 0);
    },
    [capMaterial, selected],
  );
  const hoverPerson = useAppStore((state) => state.hoverPerson);
  const selectPerson = useAppStore((state) => state.selectPerson);

  useFrame((_, delta) => {
    const current = lantern.current;
    if (!current || !holder.current) return;
    windSway(swayAnchor, swayWeight, windFrame, sway);
    holder.current.position.set(position.x, position.y, position.z).add(sway);
    // Pushed sideways, a hanging lantern swings its bottom downwind.
    current.rotation.z = sway.x * WIND.fruitTilt;
    const born = growthUniforms.uGrowth.value >= bornAt;
    const target = born ? size * (highlighted ? FRUIT_MESH.highlightScale : 1) : 0;
    if (born) {
      // The same spring as the hover: from nothing it overshoots a little, a small pop.
      stepSpring(scale.current, target, FRUIT_MESH.scaleSpring, delta);
    } else {
      scale.current.value = 0;
      scale.current.velocity = 0;
    }
    current.scale.setScalar(scale.current.value);
    glow.current = damp(glow.current, highlighted ? 1 : 0, FRUIT_MESH.haloGlow.rate, delta);
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hoverPerson(personId);
  };
  const handleOut = () => {
    // Another fruit may have taken the hover already.
    if (useAppStore.getState().hoveredPersonId === personId) hoverPerson(null);
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > NAVIGATION.clickTolerance) return;
    selectPerson(personId);
  };

  return (
    <group ref={holder} position={[position.x, position.y, position.z]}>
      <group
        ref={lantern}
        scale={size}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <mesh
          geometry={resources.haloGeometry}
          material={resources.haloMaterial}
          raycast={ignoreRaycast}
          onBeforeRender={applyGlow}
        />
        <mesh
          geometry={resources.bodyGeometry}
          material={resources.bodyMaterial}
          onBeforeRender={applyBodyFocus}
        >
          <Outlines
            thickness={TOON.outline.fruitThickness}
            color={dayPalette.outline}
            toneMapped={false}
          />
        </mesh>
        <mesh
          geometry={resources.capGeometry}
          material={resources.capMaterial}
          onBeforeRender={applyCapFocus}
        >
          <Outlines
            thickness={TOON.outline.fruitThickness}
            color={dayPalette.outline}
            toneMapped={false}
          />
        </mesh>
      </group>
      <Suspense fallback={null}>
        <FruitLabel
          text={label}
          offsetY={size * FRUIT_MESH.bottom * FRUIT_MESH.highlightScale + FRUIT_LABEL.gap}
          align={labelAlign}
          insetX={size * FRUIT_LABEL.pairInset}
          material={resources.labelMaterial}
          alwaysVisible={alwaysLabeled}
          highlighted={highlighted}
          bornAt={bornAt}
        />
      </Suspense>
    </group>
  );
}
