import { getPerson } from '@/domain/genealogy';
import type { OutlineUnion } from '@/domain/outline';
import type { PersonId } from '@/domain/types';
import { useFamily } from '../family/familyDirectory';
import styles from './AccessibleList.module.css';
import { PersonEntry } from './PersonEntry';

interface CoupleEntryProps {
  readonly union: OutlineUnion;
  /** The person whose list item holds this couple, already named above it. */
  readonly anchorId?: PersonId;
}

/** A couple and, nested under it, their children: one branch of the tree. */
export function CoupleEntry({ union, anchorId }: CoupleEntryProps) {
  const { index } = useFamily();
  const parents = union.partners.map((id) => getPerson(index, id).firstName).join(' y ');
  const others = union.partners.filter((id) => id !== anchorId);
  return (
    <>
      {others.length > 0 && (
        <p className={anchorId === undefined ? styles.rootCouple : styles.couple}>
          {anchorId !== undefined && <span className={styles.with}>con</span>}
          {others.map((id, i) => (
            <span key={id} className={styles.partner}>
              {i > 0 && <span className={styles.with}>y</span>}
              <PersonEntry personId={id} />
            </span>
          ))}
        </p>
      )}
      {union.children.length > 0 && (
        <ul className={styles.children} aria-label={`Hijos de ${parents}`}>
          {union.children.map((child) => (
            <li key={child.id}>
              <PersonEntry personId={child.id} />
              {child.unions.map((childUnion) => (
                <CoupleEntry key={childUnion.id} union={childUnion} anchorId={child.id} />
              ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
