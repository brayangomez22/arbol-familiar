import type { RefObject } from 'react';
import type { PersonId } from '@/domain/types';
import type { FruitPlacement } from '@/layout/types';
import styles from './FruitLabels.module.css';

interface FruitLabelsProps {
  readonly fruits: readonly FruitPlacement[];
  readonly names: ReadonlyMap<PersonId, string>;
  /** Filled with one element per fruit, in order; LabelProjector moves them every frame. */
  readonly labelRefs: RefObject<(HTMLElement | null)[]>;
}

/** Name tags as plain DOM over the canvas. */
export function FruitLabels({ fruits, names, labelRefs }: FruitLabelsProps) {
  return (
    <div className={styles.layer} aria-hidden="true">
      {fruits.map((fruit, i) => (
        <span
          key={fruit.personId}
          className={styles.label}
          ref={(element) => {
            labelRefs.current[i] = element;
          }}
        >
          {names.get(fruit.personId) ?? fruit.personId}
        </span>
      ))}
    </div>
  );
}
