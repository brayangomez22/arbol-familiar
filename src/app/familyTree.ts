import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import type { PersonId } from '@/domain/types';
import { buildTreeLayout } from '@/layout/buildTreeLayout';

const family = loadFamily(familyJson);

/** The shape of the family's tree, computed once: it only changes when family.json does. */
export const familyLayout = buildTreeLayout(family);

/** First name over last name, so labels stay narrow enough to sit under a fruit. */
export const fruitLabels: ReadonlyMap<PersonId, string> = new Map(
  [...family.people.values()].map((person) => [
    person.id,
    `${person.firstName}\n${person.lastName}`,
  ]),
);
