import { LIGHTING } from '@/config/constants';
import { dayPalette } from '@/config/theme';

/** Soft sky fill plus a warm sun from the upper right. */
export function Lights() {
  return (
    <>
      <hemisphereLight
        args={[dayPalette.sky.top, dayPalette.ground, LIGHTING.hemisphereIntensity]}
      />
      <directionalLight
        position={[...LIGHTING.sunPosition]}
        color={dayPalette.paper}
        intensity={LIGHTING.sunIntensity}
      />
    </>
  );
}
