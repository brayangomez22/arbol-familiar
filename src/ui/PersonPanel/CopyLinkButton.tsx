import { useEffect, useState } from 'react';
import { urlForPerson } from '@/app/routing';
import { PERSON_PANEL } from '@/config/constants';
import type { PersonId } from '@/domain/types';
import styles from './CopyLinkButton.module.css';

interface CopyLinkButtonProps {
  readonly personId: PersonId;
}

type Status = 'idle' | 'copied' | 'failed';

const LABELS: Readonly<Record<Status, string>> = {
  idle: 'Copiar enlace',
  copied: '¡Enlace copiado!',
  failed: 'No se pudo copiar',
};

/** Copies a link that opens the tree straight on this person. */
export function CopyLinkButton({ personId }: CopyLinkButtonProps) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => {
      setStatus('idle');
    }, PERSON_PANEL.copiedFeedback * 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [status]);

  return (
    <button
      type="button"
      className={styles.button}
      data-status={status}
      onClick={() => {
        navigator.clipboard
          .writeText(urlForPerson(window.location.href, personId))
          .then(() => {
            setStatus('copied');
          })
          .catch(() => {
            setStatus('failed');
          });
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {status === 'copied' ? (
          <path d="m5 12 5 5 9-10" />
        ) : (
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        )}
      </svg>
      <span aria-live="polite">{LABELS[status]}</span>
    </button>
  );
}
