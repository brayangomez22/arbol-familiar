import styles from './TitleCard.module.css';

export interface FamilySummary {
  readonly title: string;
  readonly people: number;
  readonly generations: number;
  /** Years from the first person on record to today. */
  readonly years: number;
}

interface TitleCardProps {
  readonly summary: FamilySummary;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** The family's name on a paper card, like the title of the illustration. */
export function TitleCard({ summary }: TitleCardProps) {
  return (
    <header className={styles.card}>
      <h1 className={styles.title}>{summary.title}</h1>
      <p className={styles.subtitle}>
        {plural(summary.people, 'persona', 'personas')} ·{' '}
        {plural(summary.generations, 'generación', 'generaciones')}
        {summary.years > 0 && ` · ${plural(summary.years, 'año', 'años')} de historia`}
      </p>
    </header>
  );
}
