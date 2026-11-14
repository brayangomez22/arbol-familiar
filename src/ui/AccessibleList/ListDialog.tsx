import { useEffect, useRef } from 'react';
import { useAppStore } from '@/state/store';
import { AccessibleList } from './AccessibleList';
import styles from './AccessibleList.module.css';

interface ListDialogProps {
  readonly onClose: () => void;
}

/**
 * "Ver como lista": the list over the whole view, as a native modal dialog, so focus stays inside
 * and Escape closes it. Whoever was chosen stays chosen: back in the tree, the camera flies to them.
 */
export function ListDialog({ onClose }: ListDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // The dialog unmounts as it closes, so the browser cannot hand focus back by itself.
    const returnFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="La familia, en lista"
      onCancel={(event) => {
        // A photo opened from the card is a dialog of its own: its Escape is not ours.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        // One step at a time: first the open card, then the list.
        const { selectedPersonId, selectPerson } = useAppStore.getState();
        if (selectedPersonId === null) onClose();
        else selectPerson(null);
      }}
    >
      <AccessibleList
        lead="La misma familia del árbol, persona por persona."
        action={
          <button type="button" className={styles.back} onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Volver al árbol
          </button>
        }
      />
    </dialog>
  );
}
