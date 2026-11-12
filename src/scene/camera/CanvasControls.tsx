import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Box3, Vector3 } from 'three';
import { CAMERA, NAVIGATION } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Bounds } from '@/layout/types';
import { useAppStore, type CameraAction } from '@/state/store';
import { frameBounds, type Framing } from './frameBounds';

interface CanvasControlsProps {
  readonly bounds: Bounds;
}

const { ACTION } = CameraControlsImpl;

/**
 * The camera as a canvas: drag pans, wheel and pinch zoom toward the pointer, right drag only tilts
 * a few degrees. The tree can never leave the view. Obeys camera commands from the store.
 */
export function CanvasControls({ bounds }: CanvasControlsProps) {
  const controls = useRef<CameraControlsImpl>(null);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const reducedMotion = useReducedMotion();
  const framing = useMemo(
    () => frameBounds(bounds, CAMERA.fov, aspect, NAVIGATION.framingMargin),
    [bounds, aspect],
  );
  const hasFramed = useRef(false);

  useLayoutEffect(() => {
    const current = controls.current;
    if (!current) return;
    current.mouseButtons.left = ACTION.TRUCK;
    current.mouseButtons.middle = ACTION.DOLLY;
    current.mouseButtons.right = ACTION.ROTATE;
    current.mouseButtons.wheel = ACTION.DOLLY;
    current.touches.one = ACTION.TOUCH_TRUCK;
    current.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
    current.touches.three = ACTION.NONE;
    current.setBoundary(boundaryBox(bounds));
  }, [bounds]);

  useLayoutEffect(() => {
    const current = controls.current;
    if (!current) return;
    current.maxDistance = framingDistance(framing) * NAVIGATION.maxDistanceFactor;
    if (!hasFramed.current) {
      hasFramed.current = true;
      void current.setLookAt(...framing.position, ...framing.target, false);
    }
  }, [framing]);

  useEffect(
    () =>
      useAppStore.subscribe((state, previous) => {
        const request = state.cameraRequest;
        const current = controls.current;
        if (!request || request === previous.cameraRequest || !current) return;
        runCameraAction(current, request.action, framing, !reducedMotion);
      }),
    [framing, reducedMotion],
  );

  const half = Math.PI / 2;
  return (
    <CameraControls
      ref={controls}
      makeDefault
      dollyToCursor
      minDistance={NAVIGATION.minDistance}
      minAzimuthAngle={-NAVIGATION.parallaxAngle}
      maxAzimuthAngle={NAVIGATION.parallaxAngle}
      minPolarAngle={half - NAVIGATION.parallaxAngle}
      maxPolarAngle={half + NAVIGATION.parallaxAngle}
      smoothTime={NAVIGATION.smoothTime}
      draggingSmoothTime={NAVIGATION.draggingSmoothTime}
    />
  );
}

function runCameraAction(
  controls: CameraControlsImpl,
  action: CameraAction,
  framing: Framing,
  animate: boolean,
): void {
  switch (action) {
    case 'frameAll':
      void controls.setLookAt(...framing.position, ...framing.target, animate);
      return;
    case 'zoomIn':
      void controls.dolly(controls.distance * (1 - 1 / NAVIGATION.zoomStep), animate);
      return;
    case 'zoomOut':
      void controls.dolly(controls.distance * (1 - NAVIGATION.zoomStep), animate);
      return;
  }
}

/** Where the point the camera looks at may go: the layout plus some margin. */
function boundaryBox({ min, max }: Bounds): Box3 {
  return new Box3(
    new Vector3(min.x, min.y, min.z).subScalar(NAVIGATION.boundaryMargin),
    new Vector3(max.x, max.y, max.z).addScalar(NAVIGATION.boundaryMargin),
  );
}

function framingDistance({ position, target }: Framing): number {
  return Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2]);
}
