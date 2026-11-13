import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type Group, type Material, type Object3D } from 'three';
import { FRUIT_LABEL } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import { damp } from '../damp';
import { isGrown } from '../intro/growthUniforms';
import type { LabelAlign } from './labelAlignment';
import { labelFontUrl } from './labelFont';

/** The part of troika's Text mesh we animate; drei types its ref loosely. */
interface FadingText extends Object3D {
  fillOpacity: number;
  outlineOpacity: number;
}

interface FruitLabelProps {
  readonly text: string;
  /** Distance from the fruit's center down to the top of the name. */
  readonly offsetY: number;
  /** Which way the name runs from under the fruit; see labelAlignment.ts. */
  readonly align: LabelAlign;
  /** For a side-aligned name, how far past the fruit's center it starts. */
  readonly insetX: number;
  /** Shared base material; troika derives its text shader from it. */
  readonly material: Material;
  readonly alwaysVisible: boolean;
  readonly highlighted: boolean;
  /** Hidden until its fruit pops in the intro (growth time, seconds)… */
  readonly bornAt: number;
  /** …and before its fruit's year on the timeline. */
  readonly appearYear: number;
}

/** A name under its fruit, always facing the camera; fades out when the camera is far. */
export function FruitLabel({
  text,
  offsetY,
  align,
  insetX,
  material,
  alwaysVisible,
  highlighted,
  bornAt,
  appearYear,
}: FruitLabelProps) {
  const anchor = useRef<Group>(null);
  const label = useRef<FadingText>(null);
  const opacity = useRef(alwaysVisible && isGrown(bornAt, appearYear) ? 1 : 0);
  const worldPosition = useMemo(() => new Vector3(), []);
  const drawn = useRef(false);

  useFrame(({ camera }, delta) => {
    const group = anchor.current;
    const mesh = label.current;
    if (!group || !mesh) return;

    const visible =
      alwaysVisible || highlighted
        ? 1
        : distanceFade(camera.position.distanceTo(group.getWorldPosition(worldPosition)));
    const target = isGrown(bornAt, appearYear) ? visible : 0;
    opacity.current = damp(opacity.current, target, FRUIT_LABEL.fadeRate, delta);
    mesh.fillOpacity = opacity.current;
    mesh.outlineOpacity = opacity.current * FRUIT_LABEL.outlineOpacity;
    // Skips drawing hidden names, but only once each has been drawn once: a name first shown
    // mid-intro would otherwise compile its shader then, a visible stutter.
    if (drawn.current) mesh.visible = opacity.current > FRUIT_LABEL.minOpacity;
    drawn.current = true;
  });

  return (
    <Billboard ref={anchor} position={[0, -offsetY, 0]}>
      <Text
        ref={label}
        font={labelFontUrl}
        fontSize={FRUIT_LABEL.fontSize}
        lineHeight={FRUIT_LABEL.lineHeight}
        // Drawn last, over everything (see labelMaterial in Fruits.tsx).
        renderOrder={FRUIT_LABEL.renderOrder}
        material={material}
        anchorX={align}
        anchorY="top"
        textAlign={align}
        // A name running right starts a little left of the fruit's center, and vice versa.
        position-x={align === 'left' ? -insetX : align === 'right' ? insetX : 0}
        color={dayPalette.ink}
        outlineWidth={FRUIT_LABEL.outlineWidth}
        outlineColor={dayPalette.paper}
      >
        {text}
      </Text>
    </Billboard>
  );
}

/** 1 up close, 0 far away, with a smooth ramp between `fadeStart` and `fadeEnd`. */
function distanceFade(distance: number): number {
  const t = (distance - FRUIT_LABEL.fadeStart) / (FRUIT_LABEL.fadeEnd - FRUIT_LABEL.fadeStart);
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - clamped * clamped * (3 - 2 * clamped);
}
