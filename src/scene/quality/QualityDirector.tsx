import { PerformanceMonitor } from '@react-three/drei';
import { useRef } from 'react';
import { QUALITY_MONITOR, QUALITY_TIERS, type QualityTier } from '@/config/quality';
import { stepQualityTier } from '@/state/qualityTier';
import { useAppStore } from '@/state/store';

const bounds = (refreshRate: number): [number, number] => [
  QUALITY_MONITOR.minFps,
  refreshRate > QUALITY_MONITOR.fastRefreshRate
    ? QUALITY_MONITOR.upperFpsFast
    : QUALITY_MONITOR.upperFps,
];

const rank = (tier: QualityTier) => QUALITY_TIERS.indexOf(tier);

/**
 * Measures the frame rate and moves the quality tier: down when the device struggles below the
 * target, up when the first guess was too cautious. A tier that once ran too slow is never tried
 * again, so a device on the edge settles instead of flickering between two. A tier forced from the
 * URL is left alone.
 */
export function QualityDirector() {
  const pinned = useAppStore((state) => state.qualityPinned);
  const ceiling = useRef<QualityTier>('high');
  if (pinned) return null;

  const decline = () => {
    const { qualityTier, setQualityTier } = useAppStore.getState();
    const lower = stepQualityTier(qualityTier, -1);
    ceiling.current = lower;
    setQualityTier(lower);
  };
  const incline = () => {
    const { qualityTier, setQualityTier } = useAppStore.getState();
    const higher = stepQualityTier(qualityTier, 1);
    if (rank(higher) <= rank(ceiling.current)) setQualityTier(higher);
  };

  return (
    <PerformanceMonitor
      ms={QUALITY_MONITOR.sampleMs}
      iterations={QUALITY_MONITOR.iterations}
      threshold={QUALITY_MONITOR.threshold}
      flipflops={QUALITY_MONITOR.flipflops}
      bounds={bounds}
      onDecline={decline}
      onIncline={incline}
    />
  );
}
