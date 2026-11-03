import { useMemo } from 'react';
import { LAYOUT } from '@/config/constants';
import { closestFruitDistance } from '@/layout/fruits';
import type { TreeLayout } from '@/layout/types';
import styles from './LayoutStats.module.css';

interface LayoutStatsProps {
  readonly title: string;
  readonly people: number;
  readonly layout: TreeLayout;
}

/** Numbers worth watching while tuning LAYOUT in config/constants.ts. */
export function LayoutStats({ title, people, layout }: LayoutStatsProps) {
  const closest = useMemo(() => closestFruitDistance(layout.fruits), [layout]);
  const crowded = closest < LAYOUT.fruit.minDistance;
  const { min, max } = layout.bounds;

  return (
    <aside className={styles.panel} aria-label="Estadísticas del layout">
      <h1 className={styles.title}>{title}</h1>
      <dl className={styles.stats}>
        <dt>Personas</dt>
        <dd>{people}</dd>
        <dt>Ramas · raíces</dt>
        <dd>
          {layout.branches.length} · {layout.roots.length}
        </dd>
        <dt>Zonas de hojas</dt>
        <dd>{layout.leafClusters.length}</dd>
        <dt>Distancia mínima</dt>
        <dd className={crowded ? styles.warning : undefined}>
          {crowded && '⚠ '}
          {closest.toFixed(2)} (mín. {LAYOUT.fruit.minDistance})
        </dd>
        <dt>Tamaño</dt>
        <dd>
          {(max.x - min.x).toFixed(1)} × {(max.y - min.y).toFixed(1)} × {(max.z - min.z).toFixed(1)}
        </dd>
      </dl>
      <p className={styles.hint}>
        Parámetros: <code>people=80</code> <code>seed=b</code> <code>labels=0</code>
      </p>
    </aside>
  );
}
