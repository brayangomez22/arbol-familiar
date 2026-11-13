import { Canvas } from '@react-three/fiber';
import { cssEase } from '@/animation/easings';
import { CAMERA, TIMING } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import type { PersonId } from '@/domain/types';
import type { TreeLayout } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { CanvasControls } from './camera/CanvasControls';
import { CanvasCursor } from './camera/CanvasCursor';
import { Effects } from './effects/Effects';
import { Scenery } from './environment/Scenery';
import type { FamilyTime } from './timeline/familyTime';
import { Tree } from './tree/Tree';
import { Wind } from './wind/Wind';

interface ExperienceProps {
  readonly layout: TreeLayout;
  /** Display name of each person, as shown under their fruit. */
  readonly labels: ReadonlyMap<PersonId, string>;
  /** When each person appears and leaves, for the timeline. */
  readonly time: FamilyTime;
}

export function Experience({ layout, labels, time }: ExperienceProps) {
  const qualityTier = useAppStore((state) => state.qualityTier);
  const selectPerson = useAppStore((state) => state.selectPerson);
  // Hidden until the intro decides whether to play: without it, the tree simply fades in.
  const decided = useAppStore((state) => state.introPhase !== 'pending');
  const quality = QUALITY[qualityTier];

  return (
    <Canvas
      dpr={[...quality.dpr]}
      // Opaque: the sky covers every pixel, and partial alpha on leaf edges must never let the
      // page show through.
      gl={{ antialias: quality.antialias, alpha: false }}
      style={{
        opacity: decided ? 1 : 0,
        transition: `opacity ${TIMING.reducedMotionIntroDuration}s ${cssEase('out')}`,
      }}
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
      <Wind />
      <Scenery layout={layout} />
      <Tree layout={layout} labels={labels} time={time} />
      <CanvasControls bounds={layout.bounds} />
      <CanvasCursor />
      <Effects />
    </Canvas>
  );
}
