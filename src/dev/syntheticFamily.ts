import type { Family, Person, PersonId, Union } from '@/domain/types';
import { createRandom } from '@/layout/random';

const ROOT_BIRTH_YEAR = 1930;
const ROOT_UNION_ID = 'u-root';

/**
 * A believable random family of about `size` people, for stress-testing the layout and the scene.
 * Deterministic for a given size and seed. Dev and test tooling only: never shown to the family.
 */
export function syntheticFamily(size: number, seed = 'synthetic'): Family {
  const rng = createRandom('synthetic-family', seed);
  const people = new Map<PersonId, Person>();
  const unions = new Map<string, Union>();

  const addPerson = (birthYear: number): PersonId => {
    const id = `p-${people.size}`;
    people.set(id, {
      id,
      firstName: `Persona ${people.size}`,
      lastName: 'Sintética',
      birth: { date: { year: birthYear } },
      photos: [],
    });
    return id;
  };

  const founder = addPerson(ROOT_BIRTH_YEAR);
  const founderPartner = addPerson(ROOT_BIRTH_YEAR + 2);
  const queue: { year: number; unionId: string; partners: PersonId[] }[] = [
    { year: ROOT_BIRTH_YEAR, unionId: ROOT_UNION_ID, partners: [founder, founderPartner] },
  ];

  while (people.size < size) {
    const item = queue.shift();
    if (!item) break;
    const childCount = item.unionId === ROOT_UNION_ID ? rng.int(3, 5) : rng.int(0, 4);
    const children: PersonId[] = [];
    for (let i = 0; i < childCount && people.size < size; i++) {
      const year = item.year + rng.int(22, 34) + i * 2;
      const childId = addPerson(year);
      children.push(childId);

      const unionCount = rng.next() < 0.75 ? (rng.next() < 0.12 ? 2 : 1) : 0;
      for (let u = 0; u < unionCount && people.size < size; u++) {
        const partnerId = addPerson(year + rng.int(-3, 3));
        queue.push({
          year,
          unionId: `u-${childId}-${partnerId}`,
          partners: [childId, partnerId],
        });
      }
    }
    unions.set(item.unionId, { id: item.unionId, partners: item.partners, children });
  }

  // Unions still queued when the size ran out are couples without children yet.
  for (const item of queue) {
    unions.set(item.unionId, { id: item.unionId, partners: item.partners, children: [] });
  }

  return {
    meta: { title: 'Familia sintética', rootUnionId: ROOT_UNION_ID, updatedAt: { year: 2026 } },
    places: new Map(),
    people,
    unions,
  };
}
