import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type Group, type Object3D } from 'three';
import { FRUIT_LABEL } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import { damp } from '../damp';
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
  readonly alwaysVisible: boolean;
  readonly highlighted: boolean;
}

/** A name under its fruit, always facing the camera; fades out when the camera is far. */
export function FruitLabel({ text, offsetY, alwaysVisible, highlighted }: FruitLabelProps) {
  const anchor = useRef<Group>(null);
  const label = useRef<FadingText>(null);
  const opacity = useRef(alwaysVisible ? 1 : 0);
  const worldPosition = useMemo(() => new Vector3(), []);

  useFrame(({ camera }, delta) => {
    const group = anchor.current;
    const mesh = label.current;
    if (!group || !mesh) return;

    const target =
      alwaysVisible || highlighted
        ? 1
        : distanceFade(camera.position.distanceTo(group.getWorldPosition(worldPosition)));
    opacity.current = damp(opacity.current, target, FRUIT_LABEL.fadeRate, delta);
    mesh.fillOpacity = opacity.current;
    mesh.outlineOpacity = opacity.current * FRUIT_LABEL.outlineOpacity;
    mesh.visible = opacity.current > FRUIT_LABEL.minOpacity;
  });

  return (
    <Billboard ref={anchor} position={[0, -offsetY, 0]}>
      <Text
        ref={label}
        font={labelFontUrl}
        fontSize={FRUIT_LABEL.fontSize}
        lineHeight={FRUIT_LABEL.lineHeight}
        anchorY="top"
        textAlign="center"
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
