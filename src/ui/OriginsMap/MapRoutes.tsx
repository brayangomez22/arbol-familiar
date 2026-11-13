import { useId, type CSSProperties } from 'react';
import { ORIGINS_MAP } from '@/config/constants';
import type { PlaceId } from '@/domain/types';
import type { MapRoute } from '@/layout/originsMap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { generationColor } from './generations';
import { routePath } from './mapPaths';
import styles from './MapRoutes.module.css';

interface MapRoutesProps {
  readonly routes: readonly MapRoute[];
  readonly activePlace: PlaceId | null;
}

/**
 * The family's moves, drawn in generation by generation; then a spark keeps travelling each line
 * from the parents' place to the children's, so the direction reads without arrows.
 */
export function MapRoutes({ routes, activePlace }: MapRoutesProps) {
  const prefix = useId();
  const reducedMotion = useReducedMotion();
  const firstGeneration = Math.min(...routes.map((route) => route.generation));
  const { draw, generationStagger, travel } = ORIGINS_MAP.animation;

  return (
    <g className={styles.routes} aria-hidden="true">
      {routes.map((route) => {
        const delay = (route.generation - firstGeneration) * generationStagger;
        const touches = route.from === activePlace || route.to === activePlace;
        const pathId = `${prefix}-${route.id}`;
        const width = 1.6 + 0.8 * Math.sqrt(route.people.length);
        return (
          <g
            key={route.id}
            className={`${styles.route} ${activePlace !== null && !touches ? styles.dimmed : ''}`}
            style={
              {
                '--route': generationColor(route.generation),
                '--delay': `${delay}s`,
                '--draw': `${draw}s`,
              } as CSSProperties
            }
          >
            <path className={styles.halo} d={routePath(route)} strokeWidth={width + 3} />
            <path
              id={pathId}
              className={styles.line}
              d={routePath(route)}
              pathLength={1}
              strokeWidth={width}
            />
            {!reducedMotion && (
              <circle className={styles.spark} r={width * 0.9}>
                <animateMotion
                  dur={`${travel}s`}
                  begin={`${delay + draw}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.45 0 0.55 1"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        );
      })}
    </g>
  );
}
