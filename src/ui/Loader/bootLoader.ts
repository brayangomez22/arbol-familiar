import { LOADER } from '@/config/constants';

/** The loading screen's element, written in index.html so it paints before any JavaScript. */
const BOOT_LOADER_ID = 'boot-loader';

function element(): HTMLElement | null {
  return document.getElementById(BOOT_LOADER_ID);
}

export function showBootProgress(progress: number): void {
  const loader = element();
  if (!loader) return;
  loader.style.setProperty('--progress', String(progress));
  loader.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
}

/** Fades the loading screen out and removes it; at once when there is nothing to fade into. */
export function dismissBootLoader(fade: boolean): void {
  const loader = element();
  if (!loader || loader.dataset.state === 'done') return;
  loader.dataset.state = 'done';
  loader.setAttribute('aria-hidden', 'true');
  if (!fade) {
    loader.remove();
    return;
  }
  // transitionend never fires with reduced motion (no transition), hence the timer as well.
  const remove = () => {
    loader.remove();
  };
  loader.addEventListener('transitionend', remove, { once: true });
  window.setTimeout(remove, LOADER.fade * 1000);
}
