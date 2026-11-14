/** Whether this browser can create a WebGL context at all; checked once, before mounting the scene. */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) !== null;
  } catch {
    return false;
  }
}

/** `?lista` shows the list page as if WebGL were missing: to try the fallback on any device. */
export function wantsListOnly(search: string): boolean {
  return new URLSearchParams(search).has('lista');
}
