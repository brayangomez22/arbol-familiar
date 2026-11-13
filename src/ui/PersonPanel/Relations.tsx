import { relativesOf } from '@/domain/genealogy';
import type { PersonId } from '@/domain/types';
import { useFamily } from '../family/familyDirectory';
import styles from './Relations.module.css';
import { RelativeChip } from './RelativeChip';
import sectionStyles from './Section.module.css';

interface RelationsProps {
  readonly personId: PersonId;
}

/** Parents, partners, children and siblings; each one flies the camera to them. */
export function Relations({ personId }: RelationsProps) {
  const { index } = useFamily();
  const { parents, partners, children, siblings } = relativesOf(index, personId);
  const groups = [
    { label: 'Padres', ids: parents },
    { label: partners.length === 1 ? 'Pareja' : 'Parejas', ids: partners },
    { label: 'Hijos', ids: children },
    { label: 'Hermanos', ids: siblings },
  ].filter((group) => group.ids.length > 0);
  if (groups.length === 0) return null;

  return (
    <section>
      <h3 className={sectionStyles.title}>Familia</h3>
      <dl className={styles.groups}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <dt className={styles.label}>{group.label}</dt>
            {group.ids.map((id) => (
              <dd key={id} className={styles.item}>
                <RelativeChip personId={id} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}
