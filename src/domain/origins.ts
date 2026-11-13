import { generationOf, getPerson, parentsOf, type FamilyIndex } from './genealogy';
import type { Person, PersonId, PlaceId } from './types';

/** Everyone born in one place, oldest first. */
export interface PlaceBirths {
  readonly placeId: PlaceId;
  readonly people: readonly PersonId[];
}

/**
 * Children born somewhere other than a parent: the family moving. One per origin, destination and
 * generation (of the children), so two siblings who moved alike draw a single line.
 */
export interface Migration {
  readonly from: PlaceId;
  readonly to: PlaceId;
  readonly generation: number;
  /** The children born at `to` whose parent was born at `from`, oldest first. */
  readonly people: readonly PersonId[];
}

function birthPlaceOf(person: Person): PlaceId | undefined {
  return person.birth?.placeId;
}

/** Oldest first; people without a birth date go last, then by id so the order never wobbles. */
function byBirth(index: FamilyIndex) {
  const key = (id: PersonId) => {
    const date = getPerson(index, id).birth?.date;
    return date ? date.year * 10_000 + (date.month ?? 0) * 100 + (date.day ?? 0) : Infinity;
  };
  return (a: PersonId, b: PersonId) => key(a) - key(b) || a.localeCompare(b);
}

/** Places where someone was born, the most populous first (ties by name, as people read them). */
export function birthsByPlace(index: FamilyIndex): readonly PlaceBirths[] {
  const byPlace = new Map<PlaceId, PersonId[]>();
  for (const person of index.family.people.values()) {
    const placeId = birthPlaceOf(person);
    if (placeId === undefined) continue;
    const people = byPlace.get(placeId) ?? [];
    people.push(person.id);
    byPlace.set(placeId, people);
  }
  const placeName = (id: PlaceId) => index.family.places.get(id)?.name ?? id;
  return [...byPlace]
    .map(([placeId, people]) => ({ placeId, people: people.sort(byBirth(index)) }))
    .sort(
      (a, b) =>
        b.people.length - a.people.length ||
        placeName(a.placeId).localeCompare(placeName(b.placeId), 'es'),
    );
}

export function migrations(index: FamilyIndex): readonly Migration[] {
  const groups = new Map<
    string,
    { from: PlaceId; to: PlaceId; generation: number; people: PersonId[] }
  >();
  for (const person of index.family.people.values()) {
    const to = birthPlaceOf(person);
    if (to === undefined) continue;
    const origins = new Set(
      parentsOf(index, person.id)
        .map((parentId) => birthPlaceOf(getPerson(index, parentId)))
        .filter((from): from is PlaceId => from !== undefined && from !== to),
    );
    const generation = generationOf(index, person.id);
    for (const from of origins) {
      const key = `${from}\u0000${to}\u0000${generation}`;
      const group = groups.get(key) ?? { from, to, generation, people: [] };
      group.people.push(person.id);
      groups.set(key, group);
    }
  }
  return [...groups.values()]
    .map((group) => ({ ...group, people: group.people.sort(byBirth(index)) }))
    .sort(
      (a, b) =>
        a.generation - b.generation || a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
    );
}
