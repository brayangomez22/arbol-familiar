import type { CSSProperties, ReactNode } from 'react';
import type { PlaceId } from '@/domain/types';
import type { MapPanel } from '@/layout/originsMap';
import { MapPlaceButton } from './MapPlaceButton';
import styles from './MapPanelView.module.css';
import { MapRoutes } from './MapRoutes';

interface MapPanelViewProps {
  readonly panel: MapPanel;
  /** Names the drawing for screen readers; the places are buttons of their own. */
  readonly label: string;
  /** Pointed at or chosen: its lines stand out and the others step back. */
  readonly activePlace: PlaceId | null;
  readonly chosenPlace: PlaceId | null;
  readonly onPoint: (placeId: PlaceId | null) => void;
  readonly onChoose: (placeId: PlaceId) => void;
  /** The land, drawn under the lines. */
  readonly children: ReactNode;
}

/**
 * One map: land and lines in SVG, places as real buttons on top, placed in percentages of the
 * drawing so they follow it at any size.
 */
export function MapPanelView({
  panel,
  label,
  activePlace,
  chosenPlace,
  onPoint,
  onChoose,
  children,
}: MapPanelViewProps) {
  return (
    <div
      className={styles.frame}
      style={{ '--aspect': `${panel.width} / ${panel.height}` } as CSSProperties}
    >
      <svg
        className={styles.drawing}
        viewBox={`0 0 ${panel.width} ${panel.height}`}
        role="img"
        aria-label={label}
      >
        {children}
        <MapRoutes routes={panel.routes} activePlace={activePlace} />
      </svg>
      <ul className={styles.places} aria-label="Lugares de nacimiento">
        {panel.places.map((place) => (
          <MapPlaceButton
            key={place.placeId}
            place={place}
            width={panel.width}
            height={panel.height}
            labelSize={panel.labelSize}
            chosen={place.placeId === chosenPlace}
            dimmed={activePlace !== null && place.placeId !== activePlace}
            onPoint={onPoint}
            onChoose={onChoose}
          />
        ))}
      </ul>
    </div>
  );
}
