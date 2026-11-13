import sectionStyles from './Section.module.css';
import styles from './Bio.module.css';

interface BioProps {
  readonly text: string;
}

/** The person's story, set like a page of a book. */
export function Bio({ text }: BioProps) {
  return (
    <section>
      <h3 className={sectionStyles.title}>Historia</h3>
      <p className={styles.bio}>{text}</p>
    </section>
  );
}
