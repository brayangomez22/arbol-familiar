import type { PlaceId } from '@/domain/types';
import { useFamily } from '../family/familyDirectory';
import { placeText } from '../family/personText';
import { RelativeChip } from '../PersonPanel/RelativeChip';
import styles from './OriginsMap.module.css';

interface PlacePeopleProps {
  readonly placeId: PlaceId | null;
}

function listText(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1) ?? ''}`;
}

/**
 * Who was born in the chosen place, and where their parents came from. Choosing a person goes back
 * to the tree and flies to them.
 */
export function PlacePeople({ placeId }: PlacePeopleProps) {
  const { index, originsMap } = useFamily();
  const place = placeId === null ? undefined : index.family.places.get(placeId);
  const panels = [originsMap.home, ...(originsMap.world ? [originsMap.world] : [])];
  const mapPlace = panels
    .flatMap((panel) => panel.places)
    .find((candidate) => candidate.placeId === placeId);

  if (!place || !mapPlace) {
    return (
      <section className={styles.card} aria-live="polite">
        <h3 className={styles.cardTitle}>Toca un lugar</h3>
        <p className={styles.hint}>
          Verás quién nació ahí. Toca a una persona para volver al árbol y llegar hasta su fruto.
        </p>
      </section>
    );
  }

  const placeName = (id: string) => index.family.places.get(id)?.name ?? id;
  const origins = [
    ...new Set(
      panels
        .flatMap((panel) => panel.routes)
        .filter((route) => route.to === place.id)
        .map((route) => placeName(route.from)),
    ),
  ];
  const count = mapPlace.people.length;

  return (
    <section className={styles.card} aria-live="polite" aria-label={`Nacidos en ${place.name}`}>
      <h3 className={styles.cardTitle}>{placeText(place)}</h3>
      <p className={styles.hint}>
        {count} {count === 1 ? 'persona nació' : 'personas nacieron'} aquí.
        {origins.length > 0 && ` Algunos de sus padres nacieron en ${listText(origins)}.`}
      </p>
      <ul className={styles.people}>
        {mapPlace.people.map((personId) => (
          <li key={personId}>
            <RelativeChip personId={personId} />
          </li>
        ))}
      </ul>
    </section>
  );
}
