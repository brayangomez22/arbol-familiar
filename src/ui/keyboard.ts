/**
 * Global shortcuts stay out of the way while the visitor types, uses the browser's own
 * combinations, or is inside a modal (the photo viewer handles its own keys).
 */
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return true;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('dialog') !== null
  );
}
