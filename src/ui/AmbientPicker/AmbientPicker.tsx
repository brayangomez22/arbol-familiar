import { DAY_PHASES, type DayPhase } from '@/domain/dayCycle';
import { SEASONS, type Season } from '@/domain/seasons';
import { useAppStore } from '@/state/store';
import styles from './AmbientPicker.module.css';
import { ChoiceRow } from './ChoiceRow';

const SEASON_NAMES: Readonly<Record<Season, string>> = {
  spring: 'Primavera',
  summer: 'Verano',
  autumn: 'Otoño',
  winter: 'Invierno',
};

const PHASE_NAMES: Readonly<Record<DayPhase, string>> = {
  dawn: 'Amanecer',
  day: 'Día',
  dusk: 'Atardecer',
  night: 'Noche',
};

/**
 * Hidden unless the address names `?season=` or `?time=`: forces a season and a moment of the day
 * to try them out, or to show them in the portfolio. "Auto" follows the calendar and the clock.
 */
export function AmbientPicker() {
  const season = useAppStore((state) => state.seasonOverride);
  const phase = useAppStore((state) => state.dayPhaseOverride);
  const setSeason = useAppStore((state) => state.setSeasonOverride);
  const setPhase = useAppStore((state) => state.setDayPhaseOverride);

  return (
    <section className={styles.card} aria-label="Ambiente">
      <ChoiceRow
        label="Estación"
        options={SEASONS}
        names={SEASON_NAMES}
        value={season}
        onChange={setSeason}
      />
      <ChoiceRow
        label="Hora"
        options={DAY_PHASES}
        names={PHASE_NAMES}
        value={phase}
        onChange={setPhase}
      />
    </section>
  );
}
