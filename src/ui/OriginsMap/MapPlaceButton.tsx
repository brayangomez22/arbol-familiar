import type { CSSProperties } from 'react';
import type { PlaceId } from '@/domain/types';
import type { MapPlace } from '@/layout/originsMap';
import { useFamily } from '../family/familyDirectory';
import styles from './MapPlaceButton.module.css';

interface MapPlaceButtonProps {
  readonly place: MapPlace;
  /** Size of the drawing, to place the dot in percentages of it. */
  readonly width: number;
  readonly height: number;
  /** Height of the name, in the drawing's units. */
  readonly labelSize: number;
  readonly chosen: boolean;
  readonly dimmed: boolean;
  readonly onPoint: (placeId: PlaceId | null) => void;
  readonly onChoose: (placeId: PlaceId) => void;
}

/** A birthplace: a dot as big as the people born there, the count inside and the name beside it. */
export function MapPlaceButton({
  place,
  width,
  height,
  labelSize,
  chosen,
  dimmed,
  onPoint,
  onChoose,
}: MapPlaceButtonProps) {
  const { index } = useFamily();
  const name = index.family.places.get(place.placeId)?.name ?? place.placeId;
  const count = place.people.length;
  const position = {
    '--x': `${(place.position.x / width) * 100}%`,
    '--y': `${(place.position.y / height) * 100}%`,
    '--size': `${((place.radius * 2) / width) * 100}cqw`,
    '--label': `${(labelSize / width) * 100}cqw`,
  } as CSSProperties;

  return (
    <li className={`${styles.place} ${dimmed ? styles.dimmed : ''}`} style={position}>
      <button
        type="button"
        className={`${styles.button} ${styles[place.labelSide]}`}
        aria-pressed={chosen}
        aria-label={`${name}: ${count} ${count === 1 ? 'persona nació' : 'personas nacieron'} aquí`}
        onClick={() => {
          onChoose(place.placeId);
        }}
        onPointerEnter={() => {
          onPoint(place.placeId);
        }}
        onPointerLeave={() => {
          onPoint(null);
        }}
        onFocus={() => {
          onPoint(place.placeId);
        }}
        onBlur={() => {
          onPoint(null);
        }}
      >
        <span className={styles.dot} aria-hidden="true">
          {count}
        </span>
        <span className={styles.name} aria-hidden="true">
          {name}
        </span>
      </button>
    </li>
  );
}
