import { getPerson } from '@/domain/genealogy';
import type { PersonId } from '@/domain/types';
import { useAppStore } from '@/state/store';
import { Avatar } from '../family/Avatar';
import { useFamily } from '../family/familyDirectory';
import { fullName, yearsText } from '../family/personText';
import styles from './RelativeChip.module.css';

interface RelativeChipProps {
  readonly personId: PersonId;
}

/** A relative as a small button: their fruit color, name and years. */
export function RelativeChip({ personId }: RelativeChipProps) {
  const { index, fruitColorOf } = useFamily();
  const selectPerson = useAppStore((state) => state.selectPerson);
  const hoverPerson = useAppStore((state) => state.hoverPerson);
  const person = getPerson(index, personId);
  const years = yearsText(person);

  return (
    <button
      type="button"
      className={styles.chip}
      onClick={() => {
        selectPerson(personId);
      }}
      // Their fruit glows in the tree while the pointer is on the chip.
      onPointerEnter={() => {
        hoverPerson(personId);
      }}
      onPointerLeave={() => {
        if (useAppStore.getState().hoveredPersonId === personId) hoverPerson(null);
      }}
    >
      <Avatar person={person} color={fruitColorOf(personId)} size="small" />
      <span className={styles.name}>{fullName(person)}</span>
      {years !== null && <span className={styles.years}>{years}</span>}
    </button>
  );
}
