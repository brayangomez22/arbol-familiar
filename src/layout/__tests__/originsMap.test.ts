import { describe, expect, it } from 'vitest';
import { ORIGINS_MAP } from '@/config/constants';
import type { Migration, PlaceBirths } from '@/domain/origins';
import type { Place } from '@/domain/types';
import { buildOriginsMap, type OriginsInput } from '../originsMap';

const place = (id: string, lat: number, lng: number, country = 'Colombia'): Place => ({
  id,
  name: id,
  country,
  lat,
  lng,
});

const PLACES = new Map(
  [
    place('medellin', 6.2442, -75.5812),
    place('cali', 3.4516, -76.532),
    place('bogota', 4.711, -74.0721),
    place('manizales', 5.0703, -75.5138),
    place('puerto-carreno', 6.189, -67.4859),
    place('madrid', 40.4168, -3.7038, 'España'),
  ].map((p) => [p.id, p]),
);

function input(births: PlaceBirths[], migrations: Migration[] = []): OriginsInput {
  return { places: PLACES, births, migrations };
}

const BIRTHS: PlaceBirths[] = [
  { placeId: 'medellin', people: ['a', 'b', 'c', 'd'] },
  { placeId: 'cali', people: ['e'] },
  { placeId: 'bogota', people: ['f'] },
];

describe('buildOriginsMap', () => {
  it('is deterministic', () => {
    const migrations: Migration[] = [
      { from: 'cali', to: 'medellin', generation: 1, people: ['a'] },
    ];
    expect(buildOriginsMap(input(BIRTHS, migrations))).toEqual(
      buildOriginsMap(input(BIRTHS, migrations)),
    );
  });

  it('puts every home place inside the map, north up and east right', () => {
    const { home } = buildOriginsMap(input(BIRTHS));
    for (const { position } of home.places) {
      expect(position.x).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(home.width);
      expect(position.y).toBeGreaterThan(0);
      expect(position.y).toBeLessThan(home.height);
    }
    const at = (id: string) => home.places.find((p) => p.placeId === id)?.position;
    expect(at('medellin')?.y).toBeLessThan(at('cali')?.y ?? 0);
    expect(at('bogota')?.x).toBeGreaterThan(at('cali')?.x ?? Infinity);
  });

  it('sizes the dots by how many people were born there', () => {
    const { home } = buildOriginsMap(input(BIRTHS));
    const radius = (id: string) => home.places.find((p) => p.placeId === id)?.radius ?? 0;
    expect(radius('medellin')).toBeGreaterThan(radius('cali'));
    expect(radius('cali')).toBe(radius('bogota'));
  });

  it('draws a migration from the parents’ place to the children’s, bowed off the straight line', () => {
    const { home, generations } = buildOriginsMap(
      input(BIRTHS, [{ from: 'cali', to: 'medellin', generation: 1, people: ['a'] }]),
    );
    const [route] = home.routes;
    const at = (id: string) => home.places.find((p) => p.placeId === id)?.position;
    expect(route?.start).toEqual(at('cali'));
    expect(route?.end).toEqual(at('medellin'));
    const middle = {
      x: ((route?.start.x ?? 0) + (route?.end.x ?? 0)) / 2,
      y: ((route?.start.y ?? 0) + (route?.end.y ?? 0)) / 2,
    };
    expect(route?.control).not.toEqual(middle);
    expect(generations).toEqual([1]);
  });

  it('keeps lines between the same places apart, and a trip apart from its way back', () => {
    const { home } = buildOriginsMap(
      input(BIRTHS, [
        { from: 'cali', to: 'medellin', generation: 1, people: ['a'] },
        { from: 'cali', to: 'medellin', generation: 2, people: ['b'] },
        { from: 'medellin', to: 'cali', generation: 2, people: ['e'] },
      ]),
    );
    const controls = home.routes.map((route) => `${route.control.x},${route.control.y}`);
    expect(new Set(controls).size).toBe(3);
    expect(new Set(home.routes.map((route) => route.id)).size).toBe(3);
  });

  it('has no world map when everyone was born at home', () => {
    expect(buildOriginsMap(input(BIRTHS)).world).toBeNull();
  });

  it('sends places abroad to the world map, with lines to and from home merged', () => {
    const { home, world } = buildOriginsMap(
      input(
        [...BIRTHS, { placeId: 'madrid', people: ['g'] }],
        [
          { from: 'madrid', to: 'medellin', generation: 2, people: ['a'] },
          { from: 'madrid', to: 'cali', generation: 2, people: ['e'] },
        ],
      ),
    );
    expect(home.places.map((p) => p.placeId)).not.toContain('madrid');
    expect(home.routes).toEqual([]);
    expect(world?.places.map((p) => p.placeId)).toEqual(['madrid']);
    expect(world?.routes).toHaveLength(1);
    expect(world?.routes[0]?.people).toEqual(['a', 'e']);
    expect(world?.routes[0]?.end).toEqual(world?.home);
    expect(world?.places[0]?.position.x).toBeGreaterThan(world?.home.x ?? Infinity);
  });

  it('grows the main map to fit a home place outside the outline', () => {
    const sanAndres = place('san-andres', 12.5847, -81.7006);
    const places = new Map([...PLACES, [sanAndres.id, sanAndres]]);
    const { home } = buildOriginsMap({
      places,
      births: [{ placeId: 'san-andres', people: ['h'] }],
      migrations: [],
    });
    const [island] = home.places;
    expect(island?.position.x).toBeGreaterThan(0);
    expect(island?.position.y).toBeGreaterThan(0);
    expect(home.width).toBe(ORIGINS_MAP.home.width);
  });

  it('flips labels near the right edge to the left of the dot', () => {
    const { home } = buildOriginsMap(
      input([{ placeId: 'puerto-carreno', people: ['x'] }, ...BIRTHS]),
    );
    const side = (id: string) => home.places.find((p) => p.placeId === id)?.labelSide;
    expect(side('cali')).toBe('right');
    expect(side('puerto-carreno')).toBe('left');
  });

  it('moves a name to the other side when it would cover a nearby place', () => {
    const { home } = buildOriginsMap(
      input([
        { placeId: 'bogota', people: ['a', 'b'] },
        { placeId: 'manizales', people: ['c'] },
      ]),
    );
    const side = (id: string) => home.places.find((p) => p.placeId === id)?.labelSide;
    expect(side('bogota')).toBe('right');
    expect(side('manizales')).toBe('left');
  });
});
