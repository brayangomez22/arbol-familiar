import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { QUALITY } from '@/config/quality';
import { useAppStore } from '@/state/store';

/**
 * Takes a picture of the canvas when the UI asks for one (photo mode). Mounts a capture only for
 * the frame it needs, so the canvas never has to keep its drawing buffer between frames.
 */
export function PhotoDirector() {
  const request = useAppStore((state) => state.photoRequest);
  // The last request already answered: anything newer is waiting for a frame.
  const [answered, setAnswered] = useState(0);

  return request > answered ? (
    <PhotoCapture
      key={request}
      onDone={() => {
        setAnswered(request);
      }}
    />
  ) : null;
}

interface PhotoCaptureProps {
  readonly onDone: () => void;
}

/**
 * Priority 2 runs right after the effect composer draws the frame (priority 1), inside the same
 * task: the canvas still holds that frame, and toBlob copies it on the spot. Without effects,
 * any priority above 0 stops R3F's own render, so this one draws the frame itself.
 */
function PhotoCapture({ onDone }: PhotoCaptureProps) {
  const taken = useRef(false);
  useFrame(({ gl, scene, camera }) => {
    const { qualityTier, setPhoto } = useAppStore.getState();
    // Every frame while mounted, or the canvas would freeze until the capture goes away.
    if (!QUALITY[qualityTier].postprocessing) gl.render(scene, camera);
    if (taken.current) return;
    taken.current = true;
    gl.domElement.toBlob((blob) => {
      setPhoto(blob);
      onDone();
    }, 'image/png');
  }, 2);
  return null;
}
