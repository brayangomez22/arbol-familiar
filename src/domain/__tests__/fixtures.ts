import { parsePartialDate } from '../dates';
import type { Family, PartialDate, Person, Union } from '../types';

export function date(text: string): PartialDate {
  const parsed = parsePartialDate(text);
  if (!parsed) throw new Error(`Invalid fixture date "${text}"`);
  return parsed;
}

export function person(id: string, overrides: Partial<Person> = {}): Person {
  return { id, firstName: id, lastName: 'Test', photos: [], ...overrides };
}

export function union(id: string, partners: string[], children: string[] = []): Union {
  return { id, partners, children };
}

export function family(people: Person[], unions: Union[], rootUnionId: string): Family {
  return {
    meta: { title: 'Familia de prueba', rootUnionId, updatedAt: date('2026-01-01') },
    places: new Map(),
    people: new Map(people.map((p) => [p.id, p])),
    unions: new Map(unions.map((u) => [u.id, u])),
  };
}

/**
 * grandpa + grandma
 * ├─ dad + mom (graft)
 * │  ├─ kid1 + kid1-wife (graft) → grandkid
 * │  └─ kid2
 * └─ aunt, with two unions: aunt + uncle1 → cousin1, aunt + uncle2 → cousin2
 */
export function sampleFamily(): Family {
  return family(
    [
      'grandpa',
      'grandma',
      'dad',
      'mom',
      'kid1',
      'kid1-wife',
      'kid2',
      'grandkid',
      'aunt',
      'uncle1',
      'uncle2',
      'cousin1',
      'cousin2',
    ].map((id) => person(id)),
    [
      union('u-root', ['grandpa', 'grandma'], ['dad', 'aunt']),
      union('u-dad', ['dad', 'mom'], ['kid1', 'kid2']),
      union('u-kid1', ['kid1-wife', 'kid1'], ['grandkid']),
      union('u-aunt-1', ['aunt', 'uncle1'], ['cousin1']),
      union('u-aunt-2', ['uncle2', 'aunt'], ['cousin2']),
    ],
    'u-root',
  );
}
