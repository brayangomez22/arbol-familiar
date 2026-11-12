import { Color, ShaderMaterial, type ColorRepresentation } from 'three';
import { SELECTION, TOON } from '@/config/constants';
import type { Palette } from '@/config/theme';
import fragmentShader from '@/shaders/toon.frag.glsl?raw';
import vertexShader from '@/shaders/toon.vert.glsl?raw';
import { growthUniforms, withGrowth } from '../intro/growthUniforms';
import { focusUniforms, withFocus } from '../selection/focusUniforms';
import { windUniforms, withWind } from '../wind/windUniforms';
import { toonUniforms, withToonShading } from './toonUniforms';

export interface ToonMaterialOptions {
  readonly color: ColorRepresentation;
  readonly palette: Palette;
  /** Draws grooves along meshes that carry a `bark` attribute (see branchGeometry.ts). */
  readonly bark?: boolean;
  /**
   * Rim light on the sunny edge. Off for the ground: seen from the side, its upward normals would
   * light up all over.
   */
  readonly rim?: boolean;
  /** Sways with the shared wind; the geometry must carry an `aSway` weight per vertex. */
  readonly wind?: boolean;
  /** Steps back (desaturates) when someone else is selected; see setFocused. */
  readonly focus?: boolean;
  /**
   * Can carry the selection's sap: the geometry must have `aReach` and `aSapLimit` (see
   * branchGeometry.ts) and JS drives the uniforms in `sap`.
   */
  readonly sap?: boolean;
  /** Grows in the intro; the geometry must carry `aAxis` and `aGrowAt` (see branchGeometry.ts). */
  readonly growth?: boolean;
}

/** The sap uniforms a selection animates. */
export interface SapUniforms {
  readonly uSapFront: { value: number };
  readonly uSapIntensity: { value: number };
}

/**
 * Banded "illustrated" shading: four flat tones from a colored shadow up to a warm highlight, plus
 * a soft rim on the sunny edge. Lit by a fixed sun from TOON, not by three's lights, so the look
 * never depends on what else is in the scene.
 */
export class ToonMaterial extends ShaderMaterial {
  readonly sap: SapUniforms;

  constructor({
    color,
    palette,
    bark = false,
    rim = true,
    wind = false,
    focus = false,
    sap = false,
    growth = false,
  }: ToonMaterialOptions) {
    const base = new Color(color);
    const sapUniforms: SapUniforms = { uSapFront: { value: 0 }, uSapIntensity: { value: 0 } };
    super({
      vertexShader: withGrowth(withWind(vertexShader)),
      fragmentShader: withFocus(withToonShading(fragmentShader)),
      defines: {
        ...(wind ? { USE_WIND: '' } : {}),
        ...(focus ? { USE_FOCUS: '' } : {}),
        ...(sap ? { USE_SAP: '' } : {}),
        ...(growth ? { USE_GROWTH: '' } : {}),
      },
      uniforms: {
        ...windUniforms,
        ...growthUniforms,
        ...focusUniforms,
        ...sapUniforms,
        uFocused: { value: 0 },
        uSapHead: { value: SELECTION.sap.head },
        uSapTrail: { value: SELECTION.sap.trail },
        uSapShine: { value: SELECTION.sap.shine },
        uSapShadeMix: { value: SELECTION.sap.shadeMix },
        uSapColor: { value: new Color(palette.sap) },
        ...toonUniforms(palette),
        uBaseColor: { value: base },
        uShadeColor: { value: base.clone().lerp(new Color(palette.shade), TOON.shadeMix) },
        uGrooveColor: { value: new Color(palette.trunkShadow) },
        uBarkStreaks: { value: TOON.bark.streaks },
        uBarkWarp: { value: TOON.bark.warp },
        uBarkStrength: { value: bark ? TOON.bark.strength : 0 },
        uRimStrength: { value: rim ? TOON.rimStrength : 0 },
      },
    });
    this.sap = sapUniforms;
  }

  /**
   * For a material shared by many objects (the fruits): call from each mesh's onBeforeRender so
   * the renderer uploads this object's value for its own draw.
   */
  setFocused(focused: number): void {
    const uniform = this.uniforms.uFocused;
    if (!uniform || uniform.value === focused) return;
    uniform.value = focused;
    this.uniformsNeedUpdate = true;
  }
}
