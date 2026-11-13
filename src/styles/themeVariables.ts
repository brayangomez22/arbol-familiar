import { cssEase } from '@/animation/easings';
import { INTRO, PERSON_PANEL } from '@/config/constants';
import { dayPalette, fonts, type Palette } from '@/config/theme';

/**
 * Exposes the theme to CSS Modules as custom properties, so colors live only in theme.ts and the
 * UI moves with the scene's own curves (animation/easings.ts).
 */
export function applyThemeVariables(root: HTMLElement, palette: Palette = dayPalette): void {
  const variables: Record<string, string> = {
    '--color-sky-top': palette.sky.top,
    '--color-sky-horizon': palette.sky.horizon,
    '--color-ink': palette.ink,
    '--color-paper': palette.paper,
    '--color-polaroid': palette.polaroid,
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--ease-standard': cssEase('standard'),
    '--ease-out': cssEase('out'),
    '--ease-in': cssEase('in'),
    '--duration-ui-fade': `${INTRO.uiFade}s`,
    '--panel-width': `${PERSON_PANEL.width}px`,
    '--panel-margin': `${PERSON_PANEL.margin}px`,
    '--sheet-peek': `${PERSON_PANEL.sheetPeek * 100}dvh`,
    '--sheet-full': `${PERSON_PANEL.sheetFull * 100}dvh`,
  };
  for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value);
}
