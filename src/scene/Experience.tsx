import { Canvas } from '@react-three/fiber';
import { CAMERA } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import type { TreeLayout } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { CanvasControls } from './camera/CanvasControls';
import { CanvasCursor } from './camera/CanvasCursor';
import { Effects } from './effects/Effects';
import { Scenery } from './environment/Scenery';
import { Tree } from './tree/Tree';

interface ExperienceProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
}

export function Experience({ layout, labels }: ExperienceProps) {
  const qualityTier = useAppStore((state) => state.qualityTier);
  const selectPerson = useAppStore((state) => state.selectPerson);
  const quality = QUALITY[qualityTier];

  return (
    <Canvas
      dpr={[...quality.dpr]}
      // Opaque: the sky covers every pixel, and partial alpha on leaf edges must never let the
      // page show through.
      gl={{ antialias: quality.antialias, alpha: false }}
      // No tone mapping: the theme's colors are the illustration's colors, exactly.
      flat
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [...CAMERA.position],
      }}
      // R3F only reports a miss when the press barely moved, so ending a pan never deselects.
      onPointerMissed={(event) => {
        if (event.type === 'click') selectPerson(null);
      }}
    >
      <color attach="background" args={[dayPalette.sky.horizon]} />
      <Scenery layout={layout} />
      <Tree layout={layout} labels={labels} />
      <CanvasControls bounds={layout.bounds} />
      <CanvasCursor />
      <Effects />
    </Canvas>
  );
}
