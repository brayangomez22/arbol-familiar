import { comparePartialDates, parsePartialDate } from '@/domain/dates';
import type { PartialDate } from '@/domain/types';
import type { FamilyData, PersonData } from './familySchema';

export type IssueLevel = 'error' | 'warning';

export interface FamilyIssue {
  readonly level: IssueLevel;
  /** Rule number from docs/datos.md, "Reglas de integridad". */
  readonly rule: number;
  readonly message: string;
}

export interface IntegrityOptions {
  /** Checks a path relative to public/media/people/. Rule 7 is skipped when omitted (e.g. in the browser). */
  readonly mediaExists?: (relativePath: string) => boolean;
}

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLURAL = { persona: 'personas', unión: 'uniones' } as const;

/** Checks the integrity rules of docs/datos.md on data that already matches the schema. */
export function checkFamilyIntegrity(
  data: FamilyData,
  options: IntegrityOptions = {},
): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const error = (rule: number, message: string) => issues.push({ level: 'error', rule, message });
  const warning = (rule: number, message: string) =>
    issues.push({ level: 'warning', rule, message });

  const people = new Map(data.people.map((p) => [p.id, p]));
  const unionIds = new Set(data.unions.map((u) => u.id));
  const label = (id: string) => describePerson(people.get(id), id);

  checkIds(data, error);
  checkReferences(data, people, unionIds, error);
  const parentUnions = checkSingleParentUnion(data, label, error);
  checkCycles(data, parentUnions, label, error);
  checkReachability(data, people, label, error);
  checkDates(data, people, label, error, warning);
  if (options.mediaExists) checkMedia(data, options.mediaExists, label, error);

  return issues.sort((a, b) => a.rule - b.rule);
}

type Report = (rule: number, message: string) => void;
type Label = (id: string) => string;

function describePerson(person: PersonData | undefined, id: string): string {
  return person ? `${person.firstName} ${person.lastName} (${id})` : `"${id}"`;
}

function checkIds(data: FamilyData, error: Report): void {
  const seen = new Map<string, string>();
  const entries = [
    ...data.people.map((p) => ({ id: p.id, kind: 'persona' as const })),
    ...data.unions.map((u) => ({ id: u.id, kind: 'unión' as const })),
  ];
  for (const { id, kind } of entries) {
    if (!KEBAB_CASE.test(id)) {
      error(
        1,
        `El id de ${kind} "${id}" no está en kebab-case (solo minúsculas, números y guiones, sin tildes).`,
      );
    }
    const previousKind = seen.get(id);
    if (previousKind) {
      const owners =
        previousKind === kind ? `dos ${PLURAL[kind]}` : `una ${previousKind} y una ${kind}`;
      error(1, `El id "${id}" está repetido: lo usan ${owners}. Cada id debe ser único.`);
    }
    seen.set(id, kind);
  }
  for (const placeId of Object.keys(data.places)) {
    if (!KEBAB_CASE.test(placeId)) {
      error(1, `El id de lugar "${placeId}" no está en kebab-case.`);
    }
  }
}

function checkReferences(
  data: FamilyData,
  people: ReadonlyMap<string, PersonData>,
  unionIds: ReadonlySet<string>,
  error: Report,
): void {
  if (!unionIds.has(data.meta.rootUnionId)) {
    error(2, `meta.rootUnionId apunta a la unión "${data.meta.rootUnionId}", que no existe.`);
  }
  for (const union of data.unions) {
    for (const partnerId of union.partners) {
      if (!people.has(partnerId)) {
        error(
          2,
          `La unión "${union.id}" tiene como pareja a "${partnerId}", que no existe en people.`,
        );
      }
    }
    if (new Set(union.partners).size !== union.partners.length) {
      error(2, `La unión "${union.id}" repite a la misma persona como pareja.`);
    }
    for (const childId of union.children) {
      if (!people.has(childId)) {
        error(
          2,
          `La unión "${union.id}" tiene como hijo/a a "${childId}", que no existe en people.`,
        );
      }
    }
  }
  for (const person of data.people) {
    for (const [field, event] of [
      ['birth', person.birth],
      ['death', person.death],
    ] as const) {
      const placeId = event?.placeId;
      if (placeId !== undefined && !(placeId in data.places)) {
        error(
          2,
          `${describePerson(person, person.id)}: ${field}.placeId "${placeId}" no existe en places.`,
        );
      }
    }
  }
}

/** Returns every union each person is a child of, so later rules can work even if this one fails. */
function checkSingleParentUnion(
  data: FamilyData,
  label: Label,
  error: Report,
): ReadonlyMap<string, readonly string[]> {
  const parentUnions = new Map<string, string[]>();
  for (const union of data.unions) {
    for (const childId of union.children) {
      const unions = parentUnions.get(childId) ?? [];
      unions.push(union.id);
      parentUnions.set(childId, unions);
    }
  }
  for (const [childId, unions] of parentUnions) {
    if (unions.length > 1) {
      error(
        3,
        `${label(childId)} aparece como hijo/a ${unions.length} veces (${unions.join(', ')}). Solo puede ser hijo/a de una unión.`,
      );
    }
  }
  return parentUnions;
}

function checkCycles(
  data: FamilyData,
  parentUnions: ReadonlyMap<string, readonly string[]>,
  label: Label,
  error: Report,
): void {
  const unions = new Map(data.unions.map((u) => [u.id, u]));
  const parentsOf = (id: string) =>
    (parentUnions.get(id) ?? []).flatMap((unionId) => unions.get(unionId)?.partners ?? []);

  const done = new Set<string>();
  const reported = new Set<string>();

  const visit = (id: string, path: string[]): void => {
    const loopStart = path.indexOf(id);
    if (loopStart !== -1) {
      const cycle = [...path.slice(loopStart), id];
      const key = [...new Set(cycle)].sort().join('|');
      if (!reported.has(key)) {
        reported.add(key);
        error(
          4,
          `Hay un ciclo: ${label(id)} termina siendo su propio ancestro. Cadena hijo → padre: ${cycle.join(' → ')}.`,
        );
      }
      return;
    }
    if (done.has(id)) return;
    path.push(id);
    for (const parentId of parentsOf(id)) visit(parentId, path);
    path.pop();
    done.add(id);
  };

  for (const person of data.people) visit(person.id, []);
}

function checkReachability(
  data: FamilyData,
  people: ReadonlyMap<string, PersonData>,
  label: Label,
  error: Report,
): void {
  const root = data.unions.find((u) => u.id === data.meta.rootUnionId);
  if (!root) return;

  const unionsByPartner = new Map<string, (typeof data.unions)[number][]>();
  for (const union of data.unions) {
    for (const partnerId of union.partners) {
      unionsByPartner.set(partnerId, [...(unionsByPartner.get(partnerId) ?? []), union]);
    }
  }

  const reached = new Set<string>();
  const pending = [...root.partners];
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || reached.has(id)) continue;
    reached.add(id);
    for (const union of unionsByPartner.get(id) ?? []) {
      pending.push(...union.partners, ...union.children);
    }
  }

  for (const id of people.keys()) {
    if (!reached.has(id)) {
      error(
        5,
        `${label(id)} no está conectado/a con la unión raíz "${root.id}". Agrégalo/a como hijo/a o pareja de alguien de la familia.`,
      );
    }
  }
}

function checkDates(
  data: FamilyData,
  people: ReadonlyMap<string, PersonData>,
  label: Label,
  error: Report,
  warning: Report,
): void {
  const birthOf = (id: string) => toDate(people.get(id)?.birth?.date);

  for (const person of data.people) {
    const birth = toDate(person.birth?.date);
    const death = toDate(person.death?.date);
    if (birth && death && comparePartialDates(death, birth) < 0) {
      error(
        6,
        `${label(person.id)} muere (${person.death?.date ?? ''}) antes de nacer (${person.birth?.date ?? ''}).`,
      );
    }
  }

  for (const union of data.unions) {
    for (const childId of union.children) {
      const childBirth = birthOf(childId);
      if (!childBirth) continue;
      for (const parentId of union.partners) {
        const parentBirth = birthOf(parentId);
        if (parentBirth && comparePartialDates(childBirth, parentBirth) <= 0) {
          error(
            6,
            `${label(childId)} nace (${people.get(childId)?.birth?.date ?? ''}) antes o a la vez que su padre/madre ${label(parentId)} (${people.get(parentId)?.birth?.date ?? ''}).`,
          );
        }
      }
    }

    for (let i = 1; i < union.children.length; i++) {
      const previousId = union.children[i - 1] ?? '';
      const currentId = union.children[i] ?? '';
      const previous = birthOf(previousId);
      const current = birthOf(currentId);
      if (previous && current && comparePartialDates(current, previous) < 0) {
        warning(
          8,
          `En la unión "${union.id}", ${label(currentId)} nació antes que ${label(previousId)}: ordena children por fecha de nacimiento.`,
        );
      }
    }
  }
}

function checkMedia(
  data: FamilyData,
  mediaExists: (relativePath: string) => boolean,
  label: Label,
  error: Report,
): void {
  for (const person of data.people) {
    const files = [
      ...(person.photos ?? []).map((p) => p.src),
      ...(person.audio ? [person.audio.src] : []),
    ];
    for (const src of files) {
      if (!mediaExists(src)) {
        error(7, `${label(person.id)}: no se encuentra el archivo public/media/people/${src}.`);
      }
    }
  }
}

function toDate(text: string | undefined): PartialDate | null {
  return text === undefined ? null : parsePartialDate(text);
}
