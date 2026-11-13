import { ORIGINS_MAP } from '@/config/constants';
import type { Migration, PlaceBirths } from '@/domain/origins';
import type { PersonId, Place, PlaceId } from '@/domain/types';
import {
  COLOMBIA_OUTLINE,
  MAGDALENA_RIVER,
  MOUNTAIN_MARKS,
  SEA_LABELS,
  type LngLat,
} from './geo/colombia';
import { WORLD_LANDMASSES } from './geo/world';

/** A point on a flat map, in SVG units, y down. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface MapPlace {
  readonly placeId: PlaceId;
  readonly position: Vec2;
  readonly radius: number;
  /** Everyone born there, oldest first. */
  readonly people: readonly PersonId[];
  readonly labelSide: 'left' | 'right';
}

/** A migration as a quadratic curve from the parents' birthplace to the children's. */
export interface MapRoute {
  /** Stable, for keys and to tell lines apart. */
  readonly id: string;
  readonly from: PlaceId;
  readonly to: PlaceId;
  readonly generation: number;
  readonly people: readonly PersonId[];
  readonly start: Vec2;
  readonly control: Vec2;
  readonly end: Vec2;
}

export interface MapPanel {
  readonly width: number;
  readonly height: number;
  /** Height of the places' names, in the panel's units. */
  readonly labelSize: number;
  readonly land: readonly (readonly Vec2[])[];
  readonly places: readonly MapPlace[];
  readonly routes: readonly MapRoute[];
}

export interface HomePanel extends MapPanel {
  readonly river: readonly Vec2[];
  readonly mountains: readonly Vec2[];
  readonly seas: readonly { readonly name: string; readonly at: Vec2 }[];
}

export interface WorldPanel extends MapPanel {
  /** Where the home country sits; lines to and from abroad start or end here. */
  readonly home: Vec2;
}

export interface OriginsMapLayout {
  readonly home: HomePanel;
  /** Only when someone was born abroad. */
  readonly world: WorldPanel | null;
  /** Generations that have a migration line, for the legend. */
  readonly generations: readonly number[];
}

export interface OriginsInput {
  readonly places: ReadonlyMap<PlaceId, Place>;
  readonly births: readonly PlaceBirths[];
  readonly migrations: readonly Migration[];
}

type Projection = (point: LngLat) => Vec2;

/**
 * Plate carrée with the longitudes squeezed by the cosine of the middle latitude: near the equator,
 * as Colombia is, it barely distorts and keeps every place where a reader expects it.
 */
function equirectangular(
  lng: readonly [number, number],
  lat: readonly [number, number],
  width: number,
): { project: Projection; height: number } {
  const squeeze = Math.cos((((lat[0] + lat[1]) / 2) * Math.PI) / 180);
  const unit = width / ((lng[1] - lng[0]) * squeeze);
  return {
    project: ([x, y]) => ({ x: (x - lng[0]) * squeeze * unit, y: (lat[1] - y) * unit }),
    height: (lat[1] - lat[0]) * unit,
  };
}

function bounds(points: readonly LngLat[], padding: number) {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return {
    lng: [Math.min(...lngs) - padding, Math.max(...lngs) + padding] as const,
    lat: [Math.min(...lats) - padding, Math.max(...lats) + padding] as const,
  };
}

function lngLatOf(place: Place): LngLat {
  return [place.lng, place.lat];
}

function placeRadius(count: number, scale: number): number {
  const { radius, radiusPerPerson } = ORIGINS_MAP.place;
  return (radius + radiusPerPerson * Math.sqrt(count)) * scale;
}

interface Box {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

type LabelSide = MapPlace['labelSide'];

function overlap(a: Box, b: Box): number {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return x > 0 && y > 0 ? x * y : 0;
}

function dotBox({ x, y }: Vec2, radius: number): Box {
  return { left: x - radius, right: x + radius, top: y - radius, bottom: y + radius };
}

function labelBox({ x, y }: Vec2, radius: number, side: LabelSide, name: string, size: number) {
  const { labelGap, labelCharWidth } = ORIGINS_MAP.place;
  const width = name.length * size * labelCharWidth;
  const near = radius + labelGap;
  const [left, right] =
    side === 'right' ? [x + near, x + near + width] : [x - near - width, x - near];
  return { left, right, top: y - size * 0.6, bottom: y + size * 0.6 };
}

/**
 * Each name goes on the side of its dot where it covers the fewest other dots and names, the most
 * populous places choosing first; ties keep names on the right, except near the right edge.
 */
function sideLabels(
  dots: readonly { position: Vec2; radius: number; name: string }[],
  width: number,
  size: number,
): LabelSide[] {
  const taken: Box[] = dots.map(({ position, radius }) => dotBox(position, radius));
  return dots.map(({ position, radius, name }, own) => {
    const preferred: LabelSide =
      position.x > width * ORIGINS_MAP.place.labelFlipAt ? 'left' : 'right';
    const sides: LabelSide[] = preferred === 'right' ? ['right', 'left'] : ['left', 'right'];
    const scored = sides.map((side) => {
      const box = labelBox(position, radius, side, name, size);
      const outside = Math.max(0, -box.left) + Math.max(0, box.right - width);
      const covered = taken.reduce(
        (sum, other, index) => (index === own ? sum : sum + overlap(box, other)),
        0,
      );
      return { side, box, cost: covered + outside * size };
    });
    const best = scored.reduce((a, b) => (b.cost < a.cost ? b : a));
    taken.push(best.box);
    return best.side;
  });
}

function mapPlaces(
  births: readonly PlaceBirths[],
  places: ReadonlyMap<PlaceId, Place>,
  project: Projection,
  width: number,
  scale: number,
): MapPlace[] {
  const dots = births.flatMap(({ placeId, people }) => {
    const place = places.get(placeId);
    if (!place) return [];
    return [
      {
        placeId,
        name: place.name,
        position: project(lngLatOf(place)),
        radius: placeRadius(people.length, scale),
        people,
      },
    ];
  });
  const sides = sideLabels(dots, width, ORIGINS_MAP.place.labelSize * scale);
  return dots.map(({ placeId, position, radius, people }, index) => ({
    placeId,
    position,
    radius,
    people,
    labelSide: sides[index] ?? 'right',
  }));
}

interface RouteEnds {
  readonly from: PlaceId;
  readonly to: PlaceId;
  readonly generation: number;
  readonly people: readonly PersonId[];
  readonly start: Vec2;
  readonly end: Vec2;
}

/**
 * Bows each line to the left of its direction, so a trip and its way back never overlap; further
 * lines between the same two places (other generations) bow wider.
 */
function curveRoutes(routes: readonly RouteEnds[]): MapRoute[] {
  const seen = new Map<string, number>();
  return routes.map((route) => {
    const pair = `${route.from}\u0000${route.to}`;
    const rank = seen.get(pair) ?? 0;
    seen.set(pair, rank + 1);
    const dx = route.end.x - route.start.x;
    const dy = route.end.y - route.start.y;
    const bow = ORIGINS_MAP.route.bend * (1 + rank * ORIGINS_MAP.route.bendStep);
    return {
      ...route,
      id: `${route.from}>${route.to}@${route.generation}`,
      control: {
        x: (route.start.x + route.end.x) / 2 + dy * bow,
        y: (route.start.y + route.end.y) / 2 - dx * bow,
      },
    };
  });
}

function buildHome(input: OriginsInput, isHome: (id: PlaceId) => boolean): HomePanel {
  const homePlaces = [...input.places.values()].filter((place) => isHome(place.id));
  const frame = bounds(
    [...COLOMBIA_OUTLINE, ...homePlaces.map(lngLatOf)],
    ORIGINS_MAP.home.padding,
  );
  const { width } = ORIGINS_MAP.home;
  const { project, height } = equirectangular(frame.lng, frame.lat, width);
  const places = mapPlaces(
    input.births.filter((births) => isHome(births.placeId)),
    input.places,
    project,
    width,
    1,
  );
  const position = new Map(places.map((place) => [place.placeId, place.position]));
  const routes = input.migrations.flatMap((migration) => {
    const start = position.get(migration.from);
    const end = position.get(migration.to);
    if (!start || !end || !isHome(migration.from) || !isHome(migration.to)) return [];
    return [{ ...migration, start, end }];
  });

  return {
    width,
    height,
    labelSize: ORIGINS_MAP.place.labelSize,
    land: [COLOMBIA_OUTLINE.map(project)],
    river: MAGDALENA_RIVER.map(project),
    mountains: MOUNTAIN_MARKS.map(project),
    seas: SEA_LABELS.map(({ name, at }) => ({ name, at: project(at) })),
    places,
    routes: curveRoutes(routes),
  };
}

function centerOf(points: readonly LngLat[]): LngLat {
  const sum = points.reduce(([lng, lat], [x, y]) => [lng + x, lat + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function buildWorld(input: OriginsInput, isHome: (id: PlaceId) => boolean): WorldPanel | null {
  const abroad = input.births.filter((births) => !isHome(births.placeId));
  if (abroad.length === 0) return null;

  const { width, lng, lat } = ORIGINS_MAP.world;
  const { project, height } = equirectangular(lng, lat, width);
  const places = mapPlaces(abroad, input.places, project, width, ORIGINS_MAP.place.worldScale);
  const home = project(centerOf(COLOMBIA_OUTLINE));
  const position = new Map(places.map((place) => [place.placeId, place.position]));

  // Every home city collapses into the one home marker, so their lines merge too.
  const HOME = ORIGINS_MAP.homeCountry;
  const merged = new Map<string, RouteEnds & { people: PersonId[] }>();
  for (const migration of input.migrations) {
    if (isHome(migration.from) && isHome(migration.to)) continue;
    const from = isHome(migration.from) ? HOME : migration.from;
    const to = isHome(migration.to) ? HOME : migration.to;
    const start = from === HOME ? home : position.get(from);
    const end = to === HOME ? home : position.get(to);
    if (!start || !end || from === to) continue;
    const key = `${from}\u0000${to}\u0000${migration.generation}`;
    const route = merged.get(key) ?? {
      from,
      to,
      generation: migration.generation,
      start,
      end,
      people: [],
    };
    route.people.push(...migration.people);
    merged.set(key, route);
  }

  return {
    width,
    height,
    labelSize: ORIGINS_MAP.place.labelSize * ORIGINS_MAP.place.worldScale,
    land: WORLD_LANDMASSES.map((landmass) => landmass.map(project)),
    home,
    places,
    routes: curveRoutes([...merged.values()]),
  };
}

/**
 * The family's birthplaces on an illustrated map: one dot per place where someone was born and a
 * bowed line for every move from parents to children. Places of the home country go on the main
 * map, which grows to fit any of them outside the outline; the rest, on a small world map.
 */
export function buildOriginsMap(input: OriginsInput): OriginsMapLayout {
  const isHome = (id: PlaceId) => input.places.get(id)?.country === ORIGINS_MAP.homeCountry;
  const home = buildHome(input, isHome);
  const world = buildWorld(input, isHome);
  const generations = new Set(
    [...home.routes, ...(world?.routes ?? [])].map((route) => route.generation),
  );
  return { home, world, generations: [...generations].sort((a, b) => a - b) };
}
