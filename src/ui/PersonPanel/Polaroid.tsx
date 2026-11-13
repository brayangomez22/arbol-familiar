import type { CSSProperties } from 'react';
import { PERSON_PANEL } from '@/config/constants';
import type { Photo } from '@/domain/types';
import { createRandom } from '@/layout/random';
import { LazyImage } from '../family/LazyImage';
import { mediaUrl } from '../family/mediaUrl';
import { photoCaption } from '../family/personText';
import styles from './Polaroid.module.css';

interface PolaroidProps {
  readonly photo: Photo;
  /** Tints the blurred placeholder while the photo loads. */
  readonly color: string;
  readonly alt: string;
  readonly onOpen: () => void;
}

/** One print, tilted by its own seed so the pile looks the same on every visit. */
export function Polaroid({ photo, color, alt, onOpen }: PolaroidProps) {
  const tilt = createRandom(photo.src, 'polaroid').signed() * PERSON_PANEL.polaroidTilt;
  const label = photoCaption(photo.caption, photo.year);

  return (
    <button
      type="button"
      className={styles.polaroid}
      style={{ '--tilt': `${tilt}deg`, '--fruit': color } as CSSProperties}
      aria-label={`Ver en grande: ${alt}`}
      onClick={onOpen}
    >
      <span className={styles.photo}>
        <LazyImage src={mediaUrl(photo.src)} alt={alt} />
      </span>
      {label !== null && <span className={styles.caption}>{label}</span>}
    </button>
  );
}
