import type { CSSProperties } from 'react';
import { generationColor, generationName } from './generations';
import styles from './OriginsMap.module.css';

interface GenerationLegendProps {
  readonly generations: readonly number[];
}

/** What each line color means: the generation of the children born at its end. */
export function GenerationLegend({ generations }: GenerationLegendProps) {
  return (
    <section className={styles.card} aria-label="Colores de las líneas">
      <h3 className={styles.cardTitle}>Las líneas</h3>
      <p className={styles.hint}>
        Van del lugar donde nació un padre o una madre al lugar donde nacieron sus hijos.
      </p>
      <ul className={styles.legend}>
        {generations.map((generation) => (
          <li
            key={generation}
            className={styles.legendItem}
            style={{ '--route': generationColor(generation) } as CSSProperties}
          >
            {generationName(generation)}
          </li>
        ))}
      </ul>
    </section>
  );
}
