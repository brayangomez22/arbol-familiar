import { CameraControlsImpl } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import { Vector3 } from 'three';
import { flyCamera, type CameraPose } from '@/animation/cameraFly';
import {
  releaseTimeline,
  selectTimeline,
  type SelectionTargets,
  type SelectionTiming,
} from '@/animation/selectionTimeline';
import { SELECTION, TIMING } from '@/config/constants';
import type { PersonId } from '@/domain/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { TreeReach } from '@/layout/reach';
import { sapPath } from '@/layout/sapPath';
import type { FruitPlacement, TreeLayout } from '@/layout/types';
import { useAppStore } from '@/state/store';
import type { BranchMeshHandle } from '../tree/BranchMesh';
import { focusPoint, focusUniforms } from './focusUniforms';

interface SelectionDirectorProps {
  readonly layout: TreeLayout;
  readonly reach: TreeReach;
  readonly branches: RefObject<BranchMeshHandle | null>;
}

const TIMELINE: SelectionTiming = {
  sapDuration: SELECTION.sap.duration,
  sapHead: SELECTION.sap.head,
  fadeOut: SELECTION.sap.fadeOut,
  focusDuration: SELECTION.focus.duration,
  release: SELECTION.focus.release,
  reducedFade: SELECTION.reducedMotionFade,
};

/**
 * Turns a selection in the store into motion: the camera flies to the person, sap runs up their
 * lineage and the rest of the tree steps back; deselecting lets it all go. A new selection, a drag
 * or a zoom button stops whatever was still running, so fast clicks never pile up.
 */
export function SelectionDirector({ layout, reach, branches }: SelectionDirectorProps) {
  const controls = useThree((state) => state.controls);
  const reducedMotion = useReducedMotion();
  const fruits = useMemo(
    () => new Map(layout.fruits.map((fruit) => [fruit.personId, fruit])),
    [layout.fruits],
  );

  useEffect(() => {
    const cameraControls = controls instanceof CameraControlsImpl ? controls : null;
    let timeline: gsap.core.Timeline | null = null;
    let flight: gsap.core.Tween | null = null;
    const scratch = { position: new Vector3(), target: new Vector3() };

    const stopFlight = () => {
      flight?.kill();
      flight = null;
    };

    const play = (personId: PersonId | null) => {
      timeline?.kill();
      stopFlight();
      const handle = branches.current;
      if (!handle) return;
      const targets: SelectionTargets = {
        sapFront: handle.sap.uSapFront,
        sapIntensity: handle.sap.uSapIntensity,
        focus: focusUniforms.uFocus,
        showLineage: (limits) => {
          handle.showLineage(limits);
        },
      };

      const fruit = personId === null ? undefined : fruits.get(personId);
      if (!fruit) {
        timeline = releaseTimeline(targets, TIMELINE, reducedMotion);
        return;
      }
      focusPoint.set(fruit.position.x, fruit.position.y, fruit.position.z);
      timeline = selectTimeline(
        targets,
        sapPath(layout.branches, reach, fruit.anchorBranchId),
        TIMELINE,
        reducedMotion,
      );
      if (cameraControls) flight = flyTo(cameraControls, fruit, reducedMotion, scratch);
    };

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.selectedPersonId !== previous.selectedPersonId) play(state.selectedPersonId);
      // A zoom or "frame all" button takes the camera back from the flight.
      else if (state.cameraRequest !== previous.cameraRequest) stopFlight();
    });
    cameraControls?.addEventListener('controlstart', stopFlight);
    return () => {
      unsubscribe();
      cameraControls?.removeEventListener('controlstart', stopFlight);
      timeline?.kill();
      stopFlight();
    };
  }, [controls, branches, fruits, layout.branches, reach, reducedMotion]);

  return null;
}

/** Flies (or, with reduced motion, cuts) to a framing of the person; null when there is nothing to animate. */
function flyTo(
  controls: CameraControlsImpl,
  fruit: FruitPlacement,
  reducedMotion: boolean,
  scratch: { position: Vector3; target: Vector3 },
): gsap.core.Tween | null {
  const { camera } = SELECTION;
  const target = { ...fruit.position };
  const end: CameraPose = {
    target,
    position: { x: target.x, y: target.y + camera.lift, z: target.z + camera.distance },
  };
  const apply = ({ position, target: lookAt }: CameraPose) => {
    void controls.setLookAt(
      position.x,
      position.y,
      position.z,
      lookAt.x,
      lookAt.y,
      lookAt.z,
      false,
    );
  };
  if (reducedMotion) {
    apply(end);
    return null;
  }
  controls.getPosition(scratch.position);
  controls.getTarget(scratch.target);
  return flyCamera(
    { position: scratch.position, target: scratch.target },
    end,
    { duration: TIMING.cameraFlyDuration, pullBack: camera.pullBack },
    apply,
  );
}
