import { dayPalette } from '@/config/theme';
import familyJson from '@/data/family.json';
import { loadFamily } from '@/data/loadFamily';
import { birthdaysOn } from '@/domain/birthdays';
import { generationOf, indexFamily } from '@/domain/genealogy';
import { relativeInDirection } from '@/domain/navigation';
import { birthsByPlace, migrations } from '@/domain/origins';
import { searchEntryOf } from '@/domain/search';
import { censusAt, decadeMarks, lifelines, timelineRange } from '@/domain/timeline';
import type { PersonId } from '@/domain/types';
import { buildTreeLayout } from '@/layout/buildTreeLayout';
import { buildOriginsMap } from '@/layout/originsMap';
import type { FamilyTime } from '@/scene/timeline/familyTime';
import { fruitColorIndex } from '@/scene/tree/fruitColor';
import type { FamilyDirectory } from '@/ui/family/familyDirectory';

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

const index = indexFamily(family);

const currentYear = new Date().getFullYear();
const lives = lifelines(index, currentYear);

/** When each person appears on the timeline, and the years it spans. */
export const familyTime: FamilyTime = {
  lives,
  range: timelineRange(lives, currentYear),
  birthdaysOn: (today) => birthdaysOn(family, today).map((person) => person.id),
};

/**
 * What the title card shows. Generations count from the root couple (generation 0); the history
 * runs from the first person on the timeline to this year.
 */
export const familySummary = {
  title: family.meta.title,
  people: family.people.size,
  generations: Math.max(...[...family.people.keys()].map((id) => generationOf(index, id))) + 1,
  years: familyTime.range.last - familyTime.range.first,
} as const;

const fruitX = new Map(familyLayout.fruits.map((fruit) => [fruit.personId, fruit.position.x]));

/** The family as the overlay sees it: relations, search and the colors of the fruits. */
export const familyDirectory: FamilyDirectory = {
  index,
  searchEntries: [...family.people.values()].map(searchEntryOf),
  fruitColorOf: (id) =>
    dayPalette.fruits[fruitColorIndex(id, dayPalette.fruits.length)] ?? dayPalette.trunk,
  relativeInDirection: (id, direction) =>
    relativeInDirection(index, id, direction, (relativeId) => fruitX.get(relativeId) ?? 0),
  isPerson: (id) => family.people.has(id),
  timeline: {
    range: familyTime.range,
    marks: decadeMarks(familyTime.range),
    censusAt: (year) => censusAt(lives, year),
  },
  birthdaysOn: (today) =>
    birthdaysOn(family, today).map(({ id, firstName }) => ({ id, firstName })),
  originsMap: buildOriginsMap({
    places: family.places,
    births: birthsByPlace(index),
    migrations: migrations(index),
  }),
};
