import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { livePalette } from '../ambient/livePalette';
import { SkyMaterial } from '../materials/SkyMaterial';

const ignoreRaycast = () => null;

/** Gradient from the warm horizon to the pale top, with a soft sun glow, painted on the screen. */
export function Sky() {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const geometry = useMemo(() => new PlaneGeometry(2, 2), []);
  const material = useMemo(() => new SkyMaterial(livePalette), []);
  useEffect(() => {
    material.setAspect(aspect);
  }, [material, aspect]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1}
      raycast={ignoreRaycast}
    />
  );
}
