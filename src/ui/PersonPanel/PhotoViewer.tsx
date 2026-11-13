import { useEffect, useRef } from 'react';
import type { Photo } from '@/domain/types';
import { mediaUrl } from '../family/mediaUrl';
import { photoCaption } from '../family/personText';
import styles from './PhotoViewer.module.css';

interface PhotoViewerProps {
  readonly photos: readonly Photo[];
  readonly index: number;
  /** Whose photos they are, for the alternative text. */
  readonly name: string;
  readonly onIndexChange: (index: number) => void;
  readonly onClose: () => void;
}

/** A photo large, with its caption. A native modal: Escape, focus and the backdrop come for free. */
export function PhotoViewer({ photos, index, name, onIndexChange, onClose }: PhotoViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = photos[index];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => {
      element.close();
    };
  }, []);

  if (!photo) return null;
  const many = photos.length > 1;
  const caption = photoCaption(photo.caption, photo.year);
  const go = (step: number) => {
    onIndexChange((index + step + photos.length) % photos.length);
  };

  return (
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-label={photo.caption ?? `Foto de ${name}`}
      // Escape. Not onClose: closing on unmount (also React's double effects in development) fires
      // it later, and would shut a viewer that had just opened again.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog itself, not on its content, is a click on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (!many) return;
        if (event.key === 'ArrowLeft') go(-1);
        else if (event.key === 'ArrowRight') go(1);
      }}
    >
      <figure className={styles.figure}>
        <img
          key={photo.src}
          className={styles.image}
          src={mediaUrl(photo.src)}
          alt={photo.caption ?? `Foto de ${name}`}
          decoding="async"
        />
        {caption !== null && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>
      {many && (
        <>
          <button
            type="button"
            className={`${styles.nav} ${styles.previous}`}
            aria-label="Foto anterior"
            onClick={() => {
              go(-1);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.nav} ${styles.next}`}
            aria-label="Foto siguiente"
            onClick={() => {
              go(1);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      <button type="button" className={styles.close} aria-label="Cerrar la foto" onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}
