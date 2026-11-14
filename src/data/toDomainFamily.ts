import { parsePartialDate } from '@/domain/dates';
import type { Family, LifeEvent, PartialDate, Person, Place, Union } from '@/domain/types';
// Types only: this module must never pull zod into the bundle (see app/familyData.ts).
import type { FamilyData, PersonData } from './familySchema';

/** Builds the domain model from family.json data that already passed validation. */
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
