import { createContext, useContext } from 'react';
import type { FamilyIndex } from '@/domain/genealogy';
import type { Direction } from '@/domain/navigation';
import type { SearchEntry } from '@/domain/search';
import type { LifeStage, TimelineRange } from '@/domain/timeline';
import type { PersonId } from '@/domain/types';
import type { OriginsMapLayout } from '@/layout/originsMap';

/** What the overlay knows about the family. Built once by app/, which also feeds the scene. */
export interface FamilyDirectory {
  readonly index: FamilyIndex;
  readonly searchEntries: readonly SearchEntry[];
  /** The color of the person's fruit in the tree, for avatars and dots. */
  readonly fruitColorOf: (id: PersonId) => string;
  /** The relative an arrow key moves to, following the tree as it is drawn. */
  readonly relativeInDirection: (id: PersonId, direction: Direction) => PersonId | undefined;
  readonly isPerson: (id: string) => boolean;
  readonly timeline: FamilyTimeline;
  /** Who celebrates a birthday on that day (local time), oldest first. */
  readonly birthdaysOn: (today: Date) => readonly Celebrant[];
  /** Where everyone was born and how the family moved, laid out on the map. */
  readonly originsMap: OriginsMapLayout;
}

export interface Celebrant {
  readonly id: PersonId;
  readonly firstName: string;
}

/** The years the timeline slider spans, its decade marks, and who is there in a given year. */
export interface FamilyTimeline {
  readonly range: TimelineRange;
  readonly marks: readonly number[];
  /** Null means today. */
  readonly censusAt: (year: number | null) => Readonly<Record<LifeStage, number>>;
}

export const FamilyContext = createContext<FamilyDirectory | null>(null);

export function useFamily(): FamilyDirectory {
  const directory = useContext(FamilyContext);
  if (!directory) throw new Error('useFamily needs a <FamilyContext> provider');
  return directory;
}
