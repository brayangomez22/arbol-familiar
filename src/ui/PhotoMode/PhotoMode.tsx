import { useEffect, useState } from 'react';
import { PHOTO } from '@/config/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppStore } from '@/state/store';
import { composePhoto, photoFileName } from './composePhoto';
import styles from './PhotoMode.module.css';
import { PhotoPreview } from './PhotoPreview';

interface PhotoModeProps {
  /** The family's name, stamped on the picture and in its file name. */
  readonly title: string;
}

export interface FinishedPhoto {
  readonly blob: Blob;
  readonly url: string;
  readonly fileName: string;
}

/**
 * With the UI out of the way, the visitor frames the tree by hand and takes the picture; then
 * shares, downloads, copies or opens it, whichever the device allows.
 */
export function PhotoMode({ title }: PhotoModeProps) {
  const shot = useAppStore((state) => state.photo);
  const setPhotoMode = useAppStore((state) => state.setPhotoMode);
  const requestPhoto = useAppStore((state) => state.requestPhoto);
  const setPhoto = useAppStore((state) => state.setPhoto);
  const reducedMotion = useReducedMotion();
  const [flash, setFlash] = useState(0);
  const [photo, setFinished] = useState<FinishedPhoto | null>(null);

  useEffect(() => {
    if (!shot) return;
    let cancelled = false;
    const today = new Date();
    void composePhoto(shot, title, today).then((blob) => {
      if (cancelled) return;
      setFinished({ blob, url: URL.createObjectURL(blob), fileName: photoFileName(title, today) });
    });
    return () => {
      cancelled = true;
    };
  }, [shot, title]);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  const closePreview = () => {
    setFinished(null);
    setPhoto(null);
  };

  // Escape backs out one step: from the preview to framing, from framing to the tree. Captured
  // first and marked handled, so it does not also close a person's panel underneath.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (useAppStore.getState().photo) {
        setFinished(null);
        setPhoto(null);
      } else {
        setPhotoMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [setPhoto, setPhotoMode]);

  return (
    <>
      {flash > 0 && !reducedMotion && (
        <div
          key={flash}
          className={styles.flash}
          style={{ animationDuration: `${PHOTO.flash}s` }}
          aria-hidden="true"
          onAnimationEnd={() => {
            setFlash(0);
          }}
        />
      )}
      {photo ? (
        <PhotoPreview photo={photo} title={title} onBack={closePreview} />
      ) : (
        <div className={styles.bar} role="toolbar" aria-label="Modo foto">
          <p className={styles.hint}>Mueve y acerca el árbol hasta que te guste.</p>
          <button
            type="button"
            className={styles.exit}
            onClick={() => {
              setPhotoMode(false);
            }}
          >
            Salir
          </button>
          <button
            type="button"
            className={styles.shutter}
            disabled={shot !== null}
            onClick={() => {
              setFlash((count) => count + 1);
              requestPhoto();
            }}
          >
            <span className={styles.shutterDot} aria-hidden="true" />
            Tomar foto
          </button>
        </div>
      )}
    </>
  );
}
