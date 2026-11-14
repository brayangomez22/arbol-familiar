import { Canvas } from '@react-three/fiber';
import { lazy, Suspense } from 'react';
import { cssEase } from '@/animation/easings';
import { CAMERA, TIMING } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import type { PersonId } from '@/domain/types';
import type { TreeLayout } from '@/layout/types';
import { useAppStore } from '@/state/store';
import { AmbientDirector } from './ambient/AmbientDirector';
import { livePalette } from './ambient/livePalette';
import { CanvasControls } from './camera/CanvasControls';
import { CanvasCursor } from './camera/CanvasCursor';
import { Scenery } from './environment/Scenery';
import { LoadProgressReporter } from './loading/LoadProgressReporter';
import { PhotoDirector } from './photo/PhotoDirector';
import { QualityDirector } from './quality/QualityDirector';
import type { FamilyTime } from './timeline/familyTime';
import { Tree } from './tree/Tree';
import { Wind } from './wind/Wind';

// postprocessing is a third of the scene's code and the lowest tier never uses it: it arrives on
// its own, after the first frame, and only where it will run.
const Effects = lazy(() =>
  import('./effects/Effects').then((module) => ({ default: module.Effects })),
);

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
  // The map and the list cover the whole tree: drawing it behind them only drains the battery.
  const covered = useAppStore((state) => state.mapOpen || state.listOpen);
  const quality = QUALITY[qualityTier];

  return (
    <Canvas
      dpr={[...quality.dpr]}
      // Opaque: the sky covers every pixel, and partial alpha on leaf edges must never let the
      // page show through.
      gl={{ antialias: quality.antialias, alpha: false }}
      frameloop={covered ? 'never' : 'always'}
      // Decorative: the same family is in the accessible list ("Ver como lista").
      aria-hidden="true"
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
      {/* The live color itself: the background follows the horizon without being set again. */}
      <primitive attach="background" object={livePalette.sky.horizon} />
      <AmbientDirector />
      <Wind />
      <Scenery layout={layout} />
      <Tree layout={layout} labels={labels} time={time} />
      <CanvasControls bounds={layout.bounds} />
      <CanvasCursor />
      {quality.postprocessing && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
      <QualityDirector />
      <LoadProgressReporter />
      <PhotoDirector />
    </Canvas>
  );
}
