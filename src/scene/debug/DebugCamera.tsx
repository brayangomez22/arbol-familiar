import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import { CAMERA, DEBUG_VIEW } from '@/config/constants';
import type { Bounds } from '@/layout/types';
import { frameBounds } from '../camera/frameBounds';

interface DebugCameraProps {
  readonly bounds: Bounds;
}

/** Frames the whole layout; free orbit so depth can be inspected from the side. */
export function DebugCamera({ bounds }: DebugCameraProps) {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const framing = useMemo(
    () => frameBounds(bounds, CAMERA.fov, aspect, DEBUG_VIEW.framingMargin),
    [bounds, aspect],
  );

  useLayoutEffect(() => {
    camera.position.set(...framing.position);
    camera.lookAt(...framing.target);
  }, [camera, framing]);

  return <OrbitControls makeDefault target={[...framing.target]} />;
}
