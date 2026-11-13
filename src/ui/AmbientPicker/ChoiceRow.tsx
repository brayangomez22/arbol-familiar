import styles from './AmbientPicker.module.css';

interface ChoiceRowProps<T extends string> {
  readonly label: string;
  readonly options: readonly T[];
  readonly names: Readonly<Record<T, string>>;
  /** Null is "Auto". */
  readonly value: T | null;
  readonly onChange: (value: T | null) => void;
}

/** One labelled row of toggle buttons: "Auto" plus each option. */
export function ChoiceRow<T extends string>({
  label,
  options,
  names,
  value,
  onChange,
}: ChoiceRowProps<T>) {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.choice}
        aria-pressed={value === null}
        onClick={() => {
          onChange(null);
        }}
      >
        Auto
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={styles.choice}
          aria-pressed={value === option}
          onClick={() => {
            onChange(option);
          }}
        >
          {names[option]}
        </button>
      ))}
    </div>
  );
}
