import { useEffect, useState } from 'react';
import { PERSON_PANEL } from '@/config/constants';
import type { FinishedPhoto } from './PhotoMode';
import styles from './PhotoMode.module.css';

interface PhotoPreviewProps {
  readonly photo: FinishedPhoto;
  readonly title: string;
  readonly onBack: () => void;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

function canShareFile(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

/**
 * The picture just taken, and what can be done with it here: share (phones), download, copy, or
 * open it in a new tab where the page itself cannot download.
 */
export function PhotoPreview({ photo, title, onBack }: PhotoPreviewProps) {
  const [copy, setCopy] = useState<CopyStatus>('idle');
  const file = new File([photo.blob], photo.fileName, { type: 'image/png' });
  const shareable = canShareFile(file);
  const copyable = typeof ClipboardItem !== 'undefined' && 'write' in navigator.clipboard;

  useEffect(() => {
    if (copy === 'idle') return;
    const timer = window.setTimeout(() => {
      setCopy('idle');
    }, PERSON_PANEL.copiedFeedback * 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copy]);

  return (
    <div className={styles.preview} role="dialog" aria-label="Tu foto del árbol">
      <img className={styles.picture} src={photo.url} alt={`Foto del árbol de la ${title}`} />
      <div className={styles.actions}>
        {shareable && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              // Closing the share sheet without choosing rejects: nothing to report.
              navigator.share({ files: [file], title }).catch(() => undefined);
            }}
          >
            Compartir
          </button>
        )}
        <a
          className={shareable ? styles.secondary : styles.primary}
          href={photo.url}
          download={photo.fileName}
        >
          Descargar
        </a>
        {copyable && (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              navigator.clipboard
                .write([new ClipboardItem({ 'image/png': photo.blob })])
                .then(() => {
                  setCopy('copied');
                })
                .catch(() => {
                  setCopy('failed');
                });
            }}
          >
            <span aria-live="polite">
              {copy === 'copied' ? '¡Copiada!' : copy === 'failed' ? 'No se pudo copiar' : 'Copiar'}
            </span>
          </button>
        )}
        <a className={styles.secondary} href={photo.url} target="_blank" rel="noopener">
          Abrir en otra pestaña
        </a>
        <button type="button" className={styles.secondary} onClick={onBack}>
          Tomar otra
        </button>
      </div>
    </div>
  );
}
