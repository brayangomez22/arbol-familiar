import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { cssEase } from '../src/animation/easings';
import { LOADER } from '../src/config/constants';
import { dayPalette, fonts } from '../src/config/theme';

/** `VITE_DATA=demo` builds the public portfolio with made-up people; anything else, the family. */
export type DataSet = 'family' | 'demo';

const FAMILY_FILES: Record<DataSet, string> = {
  family: 'src/data/family.json',
  demo: 'src/data/demo/family.json',
};

/** The preview WhatsApp and others show: a capture of that family's own tree. */
const SHARE_IMAGES: Record<DataSet, string> = {
  family: 'src/data/og-image.jpg',
  demo: 'src/data/demo/og-image.jpg',
};
const SHARE_IMAGE_NAME = 'og-image.jpg';

/** Photos and voice notes of real people: never part of the demo build. */
const PRIVATE_MEDIA = 'media/people';

interface FamilyMetaJson {
  readonly meta: { readonly title: string };
  readonly people: readonly unknown[];
}

export function dataSetFrom(value: string | undefined): DataSet {
  return value === 'demo' ? 'demo' : 'family';
}

/**
 * Everything the build needs to know about which family it ships:
 * - resolves `@family-data` to the real family or the demo one;
 * - validates that file with `pnpm validate:family` before bundling, and stops the build if it
 *   fails, which is what lets the app skip zod in production (see src/app/familyData.ts);
 * - writes the family's title, description and Open Graph tags into index.html, plus the theme
 *   colors the loading screen needs before any JavaScript arrives, and ships that family's
 *   preview image;
 * - leaves the real photos and voice notes out of the demo.
 */
export function familyData(dataSet: DataSet, siteUrl: string | undefined): Plugin {
  const file = resolve(FAMILY_FILES[dataSet]);
  let config: ResolvedConfig | undefined;

  return {
    name: 'family-data',
    config: () => ({ resolve: { alias: { '@family-data': file } } }),
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      if (config?.command !== 'build') return;
      try {
        // The same script, rules and messages as `pnpm validate:family`.
        execFileSync(process.execPath, ['--import', 'tsx', 'scripts/validate-family.ts', file], {
          stdio: 'inherit',
        });
      } catch {
        this.error(`${FAMILY_FILES[dataSet]} no pasó la validación: corrígelo antes de construir.`);
      }
    },
    transformIndexHtml: {
      // Before Vite processes the inline CSS, which would choke on the placeholders.
      order: 'pre',
      handler(html) {
        const family = JSON.parse(readFileSync(file, 'utf8')) as FamilyMetaJson;
        return html
          .replaceAll('%FAMILY_TITLE%', escapeHtml(family.meta.title))
          .replaceAll('%FAMILY_DESCRIPTION%', escapeHtml(describe(family)))
          .replaceAll('%OG_IMAGE%', `${siteUrl ?? config?.base ?? '/'}${SHARE_IMAGE_NAME}`)
          .replaceAll('%THEME_COLOR%', dayPalette.sky.horizon)
          .replace('%THEME_VARIABLES%', themeVariables());
      },
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: SHARE_IMAGE_NAME,
        source: readFileSync(resolve(SHARE_IMAGES[dataSet])),
      });
    },
    closeBundle() {
      if (dataSet !== 'demo' || config?.command !== 'build') return;
      rmSync(resolve(config.build.outDir, PRIVATE_MEDIA), { recursive: true, force: true });
    },
  };
}

function describe(family: FamilyMetaJson): string {
  return (
    `El árbol genealógico de la ${family.meta.title}: ${family.people.length} personas ` +
    'que crecen como un árbol ilustrado en 3D, con sus historias, fotos y lugares de origen.'
  );
}

/** The theme values and timings the static loading screen in index.html uses. */
function themeVariables(): string {
  return [
    `--color-paper:${dayPalette.paper}`,
    `--color-ink:${dayPalette.ink}`,
    `--color-sky-top:${dayPalette.sky.top}`,
    `--color-sky-horizon:${dayPalette.sky.horizon}`,
    `--color-trunk:${dayPalette.trunk}`,
    `--color-seed:${dayPalette.trunkShadow}`,
    `--font-display:${fonts.display}`,
    `--ease-out:${cssEase('out')}`,
    `--loader-fade:${LOADER.fade}s`,
    `--loader-beat:${LOADER.beat}s`,
    `--loader-initial:${LOADER.initial}`,
  ].join(';');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
