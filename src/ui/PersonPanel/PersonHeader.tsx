import type { Person } from '@/domain/types';
import { Avatar } from '../family/Avatar';
import { useFamily } from '../family/familyDirectory';
import { ageText, fullName, lifeDatesText, placeText } from '../family/personText';
import { CopyLinkButton } from './CopyLinkButton';
import styles from './PersonHeader.module.css';

interface PersonHeaderProps {
  readonly person: Person;
}

/** Portrait, name, nickname, dates, age and birthplace. */
export function PersonHeader({ person }: PersonHeaderProps) {
  const { index, fruitColorOf } = useFamily();
  const dates = lifeDatesText(person);
  const age = ageText(person, new Date());
  const placeId = person.birth?.placeId;
  const place = placeId === undefined ? undefined : index.family.places.get(placeId);

  return (
    <div className={styles.header}>
      <Avatar person={person} color={fruitColorOf(person.id)} size="large" />
      <div className={styles.text}>
        <h2 className={styles.name}>{fullName(person)}</h2>
        {person.nickname !== undefined && <p className={styles.nickname}>«{person.nickname}»</p>}
        {dates !== null && <p className={styles.line}>{dates}</p>}
        {age !== null && <p className={styles.age}>{age}</p>}
        {place && (
          <p className={styles.line}>
            <svg className={styles.pin} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2" />
            </svg>
            <span className={styles.visuallyHidden}>Lugar de nacimiento: </span>
            {placeText(place)}
          </p>
        )}
        <CopyLinkButton personId={person.id} />
      </div>
    </div>
  );
}
