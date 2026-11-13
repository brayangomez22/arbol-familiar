import { Fragment, useMemo, useState } from 'react';
import { DAY_CYCLE } from '@/config/constants';
import { useNow } from '@/hooks/useNow';
import { useAppStore } from '@/state/store';
import { useFamily } from '../family/familyDirectory';
import styles from './BirthdayNotice.module.css';

/**
 * "Hoy cumple años Ana 🎂" while someone's branch is in flower. Each name flies to that person;
 * the notice can be closed and stays closed for the rest of the day.
 */
export function BirthdayNotice() {
  const { birthdaysOn } = useFamily();
  const now = useNow(DAY_CYCLE.clockInterval);
  const day = now.toDateString();
  const celebrants = useMemo(() => birthdaysOn(new Date(day)), [birthdaysOn, day]);
  const selectPerson = useAppStore((state) => state.selectPerson);
  const [closedOn, setClosedOn] = useState<string | null>(null);

  if (celebrants.length === 0 || closedOn === day) return null;
  const verb = celebrants.length === 1 ? 'cumple' : 'cumplen';

  return (
    <aside className={styles.notice} aria-label="Cumpleaños de hoy">
      <p className={styles.text}>
        Hoy {verb} años{' '}
        {celebrants.map((person, i) => (
          <Fragment key={person.id}>
            {separatorBefore(i, celebrants.length)}
            <button
              type="button"
              className={styles.name}
              title={`Ir a ${person.firstName}`}
              onClick={() => {
                selectPerson(person.id);
              }}
            >
              {person.firstName}
            </button>
          </Fragment>
        ))}{' '}
        <span aria-hidden="true">🎂</span>
      </p>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar aviso"
        onClick={() => {
          setClosedOn(day);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}

/** "Ana", "Ana y Luis", "Ana, Luis y Sara". */
function separatorBefore(index: number, count: number): string {
  if (index === 0) return '';
  return index === count - 1 ? ' y ' : ', ';
}
