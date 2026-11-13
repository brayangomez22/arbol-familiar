import { useRef, type PointerEvent, type RefObject } from 'react';
import { NAVIGATION, PERSON_PANEL } from '@/config/constants';

export type SheetSize = 'peek' | 'full';

interface Drag {
  readonly pointerId: number;
  readonly startY: number;
  readonly startHeight: number;
  lastY: number;
  lastTime: number;
  /** Pixels per millisecond, positive downward. */
  velocity: number;
  moved: boolean;
}

export interface SheetDragHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * Drag the top of the bottom sheet to resize it: let go and it settles at its resting height, all
 * the way up, or closes. A flick carries on in its direction. While dragging the height follows
 * the finger directly on the element, never through React state.
 */
export function useSheetDrag(
  sheet: RefObject<HTMLElement | null>,
  size: SheetSize,
  onResize: (size: SheetSize) => void,
  onClose: () => void,
): SheetDragHandlers {
  const drag = useRef<Drag | null>(null);

  const finish = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const current = drag.current;
    const element = sheet.current;
    if (current?.pointerId !== event.pointerId || !element) return;
    drag.current = null;
    element.removeAttribute('data-dragging');
    if (!current.moved) return;

    const height = element.getBoundingClientRect().height;
    const peek = PERSON_PANEL.sheetPeek * window.innerHeight;
    const full = PERSON_PANEL.sheetFull * window.innerHeight;
    const next = cancelled ? size : settle(height, peek, full, current.velocity, size);
    if (next === 'close') {
      // The inline height stays so the sheet slides out from where the finger left it.
      onClose();
      return;
    }
    element.style.removeProperty('height');
    onResize(next);
  };

  return {
    onPointerDown: (event) => {
      const element = sheet.current;
      if (!element || (event.pointerType === 'mouse' && event.button !== 0)) return;
      drag.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeight: element.getBoundingClientRect().height,
        lastY: event.clientY,
        lastTime: event.timeStamp,
        velocity: 0,
        moved: false,
      };
    },
    onPointerMove: (event) => {
      const current = drag.current;
      const element = sheet.current;
      if (current?.pointerId !== event.pointerId || !element) return;
      const offset = event.clientY - current.startY;
      if (!current.moved) {
        // A press that barely moves is a tap on a button inside the grip, never a drag.
        if (Math.abs(offset) < NAVIGATION.clickTolerance) return;
        current.moved = true;
        element.setAttribute('data-dragging', '');
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const full = PERSON_PANEL.sheetFull * window.innerHeight;
      const height = Math.min(full, Math.max(0, current.startHeight - offset));
      element.style.setProperty('height', `${height}px`);
      const elapsed = event.timeStamp - current.lastTime;
      if (elapsed > 0) current.velocity = (event.clientY - current.lastY) / elapsed;
      current.lastY = event.clientY;
      current.lastTime = event.timeStamp;
    },
    onPointerUp: (event) => {
      finish(event, false);
    },
    onPointerCancel: (event) => {
      finish(event, true);
    },
  };
}

function settle(
  height: number,
  peek: number,
  full: number,
  velocity: number,
  from: SheetSize,
): SheetSize | 'close' {
  if (velocity > PERSON_PANEL.sheetFlickVelocity) return from === 'full' ? 'peek' : 'close';
  if (velocity < -PERSON_PANEL.sheetFlickVelocity) return 'full';
  if (height < peek * PERSON_PANEL.sheetCloseAt) return 'close';
  return Math.abs(height - peek) <= Math.abs(height - full) ? 'peek' : 'full';
}
