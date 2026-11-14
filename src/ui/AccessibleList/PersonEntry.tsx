import type { CSSProperties } from 'react';
import { getPerson } from '@/domain/genealogy';
import type { PersonId } from '@/domain/types';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import { fullName, yearsText } from '../family/personText';
import styles from './AccessibleList.module.css';

interface PersonEntryProps {
  readonly personId: PersonId;
}

/**
 * One person in the list: name, years and birthplace, read in one go by a screen reader. Choosing
 * them opens the same card the tree opens.
 */
export function PersonEntry({ personId }: PersonEntryProps) {
  const { index, fruitColorOf } = useFamily();
  const selected = useAppStore((state) => state.selectedPersonId === personId);
  const selectPerson = useAppStore((state) => state.selectPerson);
  const person = getPerson(index, personId);
  const placeId = person.birth?.placeId;
  const place = placeId === undefined ? undefined : index.family.places.get(placeId);
  const details = [yearsText(person), place && `nació en ${place.name}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      className={styles.person}
      data-person-id={personId}
      aria-current={selected ? 'true' : undefined}
      style={{ '--fruit': fruitColorOf(personId) } as CSSProperties}
      onClick={() => {
        selectPerson(personId);
      }}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.name}>{fullName(person)}</span>
      {person.nickname !== undefined && (
        <span className={styles.nickname}>«{person.nickname}»</span>
      )}
      {details !== '' && <span className={styles.details}>{details}</span>}
    </button>
  );
}
