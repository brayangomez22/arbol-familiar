import { parsePartialDate } from '@/domain/dates';
import type { Family, LifeEvent, PartialDate, Person, Place, Union } from '@/domain/types';
import { checkFamilyIntegrity, type FamilyIssue, type IntegrityOptions } from './familyIntegrity';
import { familySchema, type FamilyData, type PersonData } from './familySchema';

/** Schema problems are reported as rule 0, before any integrity rule runs. */
export const SCHEMA_RULE = 0;

export type FamilyValidation =
  | { readonly ok: true; readonly data: FamilyData; readonly issues: readonly FamilyIssue[] }
  | { readonly ok: false; readonly issues: readonly FamilyIssue[] };

export class FamilyValidationError extends Error {
  readonly issues: readonly FamilyIssue[];

  constructor(issues: readonly FamilyIssue[]) {
    const errors = issues.filter((issue) => issue.level === 'error');
    super(`family.json no es válido:\n${errors.map((issue) => `- ${issue.message}`).join('\n')}`);
    this.name = 'FamilyValidationError';
    this.issues = issues;
  }
}

export function validateFamilyData(raw: unknown, options?: IntegrityOptions): FamilyValidation {
  const parsed = familySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        level: 'error',
        rule: SCHEMA_RULE,
        message: `${formatPath(issue.path, raw)}: ${issue.message}`,
      })),
    };
  }

  const issues = checkFamilyIntegrity(parsed.data, options);
  if (issues.some((issue) => issue.level === 'error')) return { ok: false, issues };
  return { ok: true, data: parsed.data, issues };
}

export function loadFamily(raw: unknown): Family {
  const result = validateFamilyData(raw);
  if (!result.ok) throw new FamilyValidationError(result.issues);
  return toDomainFamily(result.data);
}

export function toDomainFamily(data: FamilyData): Family {
  return {
    meta: {
      title: data.meta.title,
      rootUnionId: data.meta.rootUnionId,
      updatedAt: toPartialDate(data.meta.updatedAt),
    },
    places: new Map(
      Object.entries(data.places).map(([id, place]): [string, Place] => [id, { id, ...place }]),
    ),
    people: new Map(data.people.map((person) => [person.id, toPerson(person)])),
    unions: new Map(
      data.unions.map((union): [string, Union] => [
        union.id,
        {
          id: union.id,
          partners: union.partners,
          children: union.children,
          ...(union.since !== undefined && { since: toPartialDate(union.since) }),
        },
      ]),
    ),
  };
}

function toPerson({ birth, death, photos, ...rest }: PersonData): Person {
  return {
    ...rest,
    photos: photos ?? [],
    ...(birth && { birth: toLifeEvent(birth) }),
    ...(death && { death: toLifeEvent(death) }),
  };
}

function toLifeEvent({ date, placeId }: { date?: string; placeId?: string }): LifeEvent {
  return {
    ...(date !== undefined && { date: toPartialDate(date) }),
    ...(placeId !== undefined && { placeId }),
  };
}

function toPartialDate(text: string): PartialDate {
  const date = parsePartialDate(text);
  // The schema already rejected invalid dates, so this only guards against misuse.
  if (!date) throw new Error(`Invalid date "${text}"`);
  return date;
}

/** Turns ["people", 3, "birth"] into `people[3] (ana-alvarez).birth` so the entry is easy to find. */
function formatPath(path: readonly PropertyKey[], raw: unknown): string {
  if (path.length === 0) return 'family.json';
  let text = '';
  let node: unknown = raw;
  for (const key of path) {
    text += typeof key === 'number' ? `[${key}]` : `${text ? '.' : ''}${String(key)}`;
    node = isRecord(node) ? node[key] : undefined;
    if (typeof key === 'number' && isRecord(node) && typeof node.id === 'string') {
      text += ` (${node.id})`;
    }
  }
  return text;
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}
