import { describe, expect, it } from 'vitest';
import { indexFamily } from '../genealogy';
import { birthsByPlace, migrations } from '../origins';
import type { Family, Person } from '../types';
import { date, sampleFamily } from './fixtures';

/** The sample family with birth places (and some dates) filled in. */
function familyWithPlaces(births: Record<string, [string, string?]>): Family {
  const base = sampleFamily();
  const people = new Map(
    [...base.people].map(([id, person]): [string, Person] => {
      const birth = births[id];
      if (!birth) return [id, person];
      const [placeId, when] = birth;
      return [id, { ...person, birth: { placeId, ...(when ? { date: date(when) } : {}) } }];
    }),
  );
  const place = (id: string, name: string) => ({ id, name, country: 'Colombia', lat: 0, lng: 0 });
  return {
    ...base,
    people,
    places: new Map([
      ['medellin', place('medellin', 'Medellín')],
      ['cali', place('cali', 'Cali')],
      ['bogota', place('bogota', 'Bogotá')],
    ]),
  };
}

describe('birthsByPlace', () => {
  it('counts births per place, most populous first and oldest first within a place', () => {
    const index = indexFamily(
      familyWithPlaces({
        grandpa: ['medellin', '1938'],
        grandma: ['medellin', '1941'],
        dad: ['cali', '1965'],
        aunt: ['medellin', '1963'],
        kid1: ['bogota', '1990'],
        kid2: ['cali', '1992'],
      }),
    );
    expect(birthsByPlace(index)).toEqual([
      { placeId: 'medellin', people: ['grandpa', 'grandma', 'aunt'] },
      { placeId: 'cali', people: ['dad', 'kid2'] },
      { placeId: 'bogota', people: ['kid1'] },
    ]);
  });

  it('breaks ties by place name and leaves out people without a birth place', () => {
    const index = indexFamily(familyWithPlaces({ kid1: ['medellin'], kid2: ['bogota'] }));
    expect(birthsByPlace(index).map((births) => births.placeId)).toEqual(['bogota', 'medellin']);
  });

  it('puts people without a birth date after the dated ones', () => {
    const index = indexFamily(familyWithPlaces({ kid1: ['cali'], kid2: ['cali', '1992'] }));
    expect(birthsByPlace(index)[0]?.people).toEqual(['kid2', 'kid1']);
  });
});

describe('migrations', () => {
  it('links each parent born elsewhere to the child, by the child’s generation', () => {
    const index = indexFamily(
      familyWithPlaces({
        grandpa: ['medellin'],
        grandma: ['cali'],
        dad: ['medellin', '1965'],
        aunt: ['medellin', '1963'],
        mom: ['bogota'],
        kid1: ['medellin', '1990'],
        kid2: ['medellin', '1992'],
      }),
    );
    expect(migrations(index)).toEqual([
      // Grandma came from Cali: both her children were born in Medellín.
      { from: 'cali', to: 'medellin', generation: 1, people: ['aunt', 'dad'] },
      // Mom came from Bogotá; dad was born where his children were, so he adds no line.
      { from: 'bogota', to: 'medellin', generation: 2, people: ['kid1', 'kid2'] },
    ]);
  });

  it('draws one line when both parents come from the same place', () => {
    const index = indexFamily(familyWithPlaces({ dad: ['cali'], mom: ['cali'], kid1: ['bogota'] }));
    expect(migrations(index)).toEqual([
      { from: 'cali', to: 'bogota', generation: 2, people: ['kid1'] },
    ]);
  });

  it('ignores parents or children with unknown birth places', () => {
    const index = indexFamily(familyWithPlaces({ dad: ['cali'], kid2: ['bogota'] }));
    expect(migrations(index)).toEqual([
      { from: 'cali', to: 'bogota', generation: 2, people: ['kid2'] },
    ]);
    expect(migrations(indexFamily(familyWithPlaces({})))).toEqual([]);
  });
});
