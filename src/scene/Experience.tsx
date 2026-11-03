import { Canvas } from '@react-three/fiber';
import { CAMERA } from '@/config/constants';
import { QUALITY } from '@/config/quality';
import { dayPalette } from '@/config/theme';
import { useAppStore } from '@/state/store';

export function Experience() {
  const qualityTier = useAppStore((state) => state.qualityTier);
  const quality = QUALITY[qualityTier];

  return (
    <Canvas
      dpr={[...quality.dpr]}
      gl={{ antialias: quality.antialias }}
      camera={{
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
        position: [...CAMERA.position],
      }}
    >
      <color attach="background" args={[dayPalette.sky.horizon]} />
    </Canvas>
  );
}
