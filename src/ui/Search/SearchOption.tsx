import { getPerson } from '@/domain/genealogy';
import type { PersonId } from '@/domain/types';
import { Avatar } from '../family/Avatar';
import { useFamily } from '../family/familyDirectory';
import { fullName, yearsText } from '../family/personText';
import styles from './SearchOption.module.css';

interface SearchOptionProps {
  readonly id: string;
  readonly personId: PersonId;
  readonly active: boolean;
  readonly onChoose: () => void;
  readonly onActivate: () => void;
}

/** One person in the results: fruit color, name, nickname and years. */
export function SearchOption({ id, personId, active, onChoose, onActivate }: SearchOptionProps) {
  const { index, fruitColorOf } = useFamily();
  const person = getPerson(index, personId);
  const years = yearsText(person);

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      className={styles.option}
      // Keeps the focus in the input, so typing can go on.
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onChoose}
      onPointerMove={onActivate}
    >
      <Avatar person={person} color={fruitColorOf(personId)} size="small" />
      <span className={styles.name}>
        {fullName(person)}
        {person.nickname !== undefined && (
          <span className={styles.nickname}> «{person.nickname}»</span>
        )}
      </span>
      {years !== null && <span className={styles.years}>{years}</span>}
    </li>
  );
}
