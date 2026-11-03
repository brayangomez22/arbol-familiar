import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import type { FamilyIssue } from '@/data/familyIntegrity';
import { SCHEMA_RULE, validateFamilyData } from '@/data/loadFamily';

const DEFAULT_FAMILY_PATH = 'src/data/family.json';
const MEDIA_ROOT = 'public/media/people';

const RULE_TITLES: Record<number, string> = {
  [SCHEMA_RULE]: 'Formato (esquema)',
  1: 'Regla 1 · ids únicos y en kebab-case',
  2: 'Regla 2 · referencias existentes',
  3: 'Regla 3 · hijo/a de una sola unión',
  4: 'Regla 4 · sin ciclos',
  5: 'Regla 5 · todos conectados con la raíz',
  6: 'Regla 6 · fechas coherentes',
  7: 'Regla 7 · archivos de fotos y audio',
  8: 'Regla 8 · orden de los hijos',
};

const familyPath = resolve(argv[2] ?? DEFAULT_FAMILY_PATH);
const relativePath = relative(cwd(), familyPath);
const displayPath = relativePath.startsWith('..') ? familyPath : relativePath;

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(familyPath, 'utf8'));
} catch (cause) {
  const reason = cause instanceof Error ? cause.message : String(cause);
  console.error(`✗ No se pudo leer ${displayPath} como JSON.\n  ${reason}`);
  exit(1);
}

const result = validateFamilyData(raw, {
  mediaExists: (src) => existsSync(resolve(MEDIA_ROOT, src)),
});

const errors = result.issues.filter((issue) => issue.level === 'error');
const warnings = result.issues.filter((issue) => issue.level === 'warning');

printGroup('✗ Errores', errors);
printGroup('⚠ Advertencias', warnings);

if (result.ok) {
  const { people, unions } = result.data;
  console.log(
    `✓ ${displayPath} es válido: ${people.length} personas, ${unions.length} uniones` +
      (warnings.length > 0 ? `, ${warnings.length} advertencia(s).` : '.'),
  );
} else {
  console.error(
    `\n✗ ${displayPath} tiene ${errors.length} error(es). Corrígelos y vuelve a correr pnpm validate:family.`,
  );
  exit(1);
}

function printGroup(title: string, issues: readonly FamilyIssue[]): void {
  if (issues.length === 0) return;
  console.log(`${title}:`);
  let currentRule: number | undefined;
  for (const issue of issues) {
    if (issue.rule !== currentRule) {
      currentRule = issue.rule;
      console.log(`  ${RULE_TITLES[issue.rule] ?? `Regla ${issue.rule}`}`);
    }
    console.log(`    - ${issue.message}`);
  }
  console.log('');
}
