import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { originsMapPalette } from '@/config/theme';
import type { PlaceId } from '@/domain/types';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { GenerationLegend } from './GenerationLegend';
import { HomeLand } from './HomeLand';
import { MapPanelView } from './MapPanelView';
import styles from './OriginsMap.module.css';
import { PlacePeople } from './PlacePeople';
import { WorldLand } from './WorldLand';

const MAP_VARIABLES = {
  '--map-place': originsMapPalette.place,
  '--map-place-text': originsMapPalette.placeText,
} as CSSProperties;

interface OriginsMapProps {
  readonly onClose: () => void;
}

/**
 * "De dónde venimos": the family's birthplaces on an illustrated map, with the moves from parents
 * to children. Choosing someone from a place goes back to the tree and flies to them.
 */
export function OriginsMap({ onClose }: OriginsMapProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { originsMap } = useFamily();
  const [chosenPlace, setChosenPlace] = useState<PlaceId | null>(null);
  const [pointedPlace, setPointedPlace] = useState<PlaceId | null>(null);
  const activePlace = pointedPlace ?? chosenPlace;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => {
      element.close();
    };
  }, []);

  // Someone chosen from the list (or anywhere else): back to the tree, which flies to them.
  useEffect(
    () =>
      useAppStore.subscribe((state, previous) => {
        if (state.selectedPersonId !== null && state.selectedPersonId !== previous.selectedPersonId)
          onClose();
      }),
    [onClose],
  );

  const placeHandlers = {
    activePlace,
    chosenPlace,
    onPoint: setPointedPlace,
    onChoose: (placeId: PlaceId) => {
      setChosenPlace(placeId === chosenPlace ? null : placeId);
    },
  };

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      style={
        {
          ...MAP_VARIABLES,
          '--map-ratio': originsMap.home.width / originsMap.home.height,
        } as CSSProperties
      }
      aria-labelledby="origins-map-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id="origins-map-title" className={styles.title}>
            De dónde venimos
          </h2>
          <p className={styles.subtitle}>
            Dónde nació cada uno y cómo se fue moviendo la familia, de padres a hijos.
          </p>
        </div>
        <button type="button" className={styles.back} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6ZM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
          </svg>
          Volver al árbol
        </button>
      </header>
      <div className={styles.body}>
        <div
          className={styles.home}
          style={{ '--map-ratio': originsMap.home.width / originsMap.home.height } as CSSProperties}
        >
          <MapPanelView panel={originsMap.home} label="Mapa de Colombia" {...placeHandlers}>
            <HomeLand panel={originsMap.home} />
          </MapPanelView>
        </div>
        <aside className={styles.side}>
          {originsMap.world && (
            <section className={styles.card} aria-label="Fuera de Colombia">
              <h3 className={styles.cardTitle}>Fuera de Colombia</h3>
              <MapPanelView panel={originsMap.world} label="Mapa del mundo" {...placeHandlers}>
                <WorldLand panel={originsMap.world} />
              </MapPanelView>
            </section>
          )}
          <PlacePeople placeId={chosenPlace} />
          {originsMap.generations.length > 0 && (
            <GenerationLegend generations={originsMap.generations} />
          )}
        </aside>
      </div>
    </dialog>
  );
}
