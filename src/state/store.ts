import { create, type StateCreator } from 'zustand';
import { DEFAULT_QUALITY_TIER, type QualityTier } from '@/config/quality';
import type { PersonId } from '@/domain/types';

export interface SelectionSlice {
  selectedPersonId: PersonId | null;
  hoveredPersonId: PersonId | null;
  selectPerson: (id: PersonId | null) => void;
  hoverPerson: (id: PersonId | null) => void;
}

export interface TimelineSlice {
  /** null means "today": the whole tree is shown. */
  timelineYear: number | null;
  setTimelineYear: (year: number | null) => void;
}

export interface QualitySlice {
  qualityTier: QualityTier;
  setQualityTier: (tier: QualityTier) => void;
}

export interface AudioSlice {
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
}

export type IntroPhase = 'pending' | 'playing' | 'done';

export interface IntroSlice {
  introPhase: IntroPhase;
  setIntroPhase: (phase: IntroPhase) => void;
}

export type AppState = SelectionSlice & TimelineSlice & QualitySlice & AudioSlice & IntroSlice;

type Slice<T> = StateCreator<AppState, [], [], T>;

const createSelectionSlice: Slice<SelectionSlice> = (set) => ({
  selectedPersonId: null,
  hoveredPersonId: null,
  selectPerson: (id) => {
    set({ selectedPersonId: id });
  },
  hoverPerson: (id) => {
    set({ hoveredPersonId: id });
  },
});

const createTimelineSlice: Slice<TimelineSlice> = (set) => ({
  timelineYear: null,
  setTimelineYear: (year) => {
    set({ timelineYear: year });
  },
});

const createQualitySlice: Slice<QualitySlice> = (set) => ({
  qualityTier: DEFAULT_QUALITY_TIER,
  setQualityTier: (tier) => {
    set({ qualityTier: tier });
  },
});

const createAudioSlice: Slice<AudioSlice> = (set) => ({
  // Off by default: sound must never start without the visitor asking for it.
  audioEnabled: false,
  setAudioEnabled: (enabled) => {
    set({ audioEnabled: enabled });
  },
});

const createIntroSlice: Slice<IntroSlice> = (set) => ({
  introPhase: 'pending',
  setIntroPhase: (phase) => {
    set({ introPhase: phase });
  },
});

export const useAppStore = create<AppState>()((...args) => ({
  ...createSelectionSlice(...args),
  ...createTimelineSlice(...args),
  ...createQualitySlice(...args),
  ...createAudioSlice(...args),
  ...createIntroSlice(...args),
}));
