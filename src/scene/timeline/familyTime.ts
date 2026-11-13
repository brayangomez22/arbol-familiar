import type { Lifeline, TimelineRange } from '@/domain/timeline';
import type { PersonId } from '@/domain/types';

/** What the scene needs to show the tree in any year of the family's history. */
export interface FamilyTime {
  readonly lives: ReadonlyMap<PersonId, Lifeline>;
  readonly range: TimelineRange;
}
