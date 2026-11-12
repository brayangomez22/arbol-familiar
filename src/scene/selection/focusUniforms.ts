import { Vector3 } from 'three';
import { SELECTION } from '@/config/constants';
import focusChunk from '@/shaders/focus.glsl?raw';

/**
 * The uniforms of shaders/focus.glsl, shared by reference by every tree material so one tween of
 * uFocus steps the whole tree back at once.
 */
export const focusUniforms = {
  uFocus: { value: 0 },
  uFocusDesaturation: { value: SELECTION.focus.desaturation },
};

/** The point the depth of field keeps sharp: the selected person's fruit. */
export const focusPoint = new Vector3();

/** A fragment shader with the focus helpers in front of it. */
export function withFocus(fragmentShader: string): string {
  return `${focusChunk}\n${fragmentShader}`;
}
