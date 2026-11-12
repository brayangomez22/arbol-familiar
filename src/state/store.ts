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
  /** How many times the visitor asked to see the intro again; each one plays it from the seed. */
  introReplays: number;
  setIntroPhase: (phase: IntroPhase) => void;
  replayIntro: () => void;
}

export type CameraAction = 'zoomIn' | 'zoomOut' | 'frameAll';

export interface CameraRequest {
  readonly action: CameraAction;
  readonly id: number;
}

export interface CameraSlice {
  /** Latest command from the UI for the scene's camera. */
  cameraRequest: CameraRequest | null;
  requestCamera: (action: CameraAction) => void;
}

export type AppState = SelectionSlice &
  TimelineSlice &
  QualitySlice &
  AudioSlice &
  IntroSlice &
  CameraSlice;

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

const createIntroSlice: Slice<IntroSlice> = (set, get) => ({
  introPhase: 'pending',
  introReplays: 0,
  setIntroPhase: (phase) => {
    set({ introPhase: phase });
  },
  replayIntro: () => {
    // The intro flies the camera from the seed: a selected person would fight it for the view.
    set({
      introPhase: 'playing',
      introReplays: get().introReplays + 1,
      selectedPersonId: null,
      hoveredPersonId: null,
    });
  },
});

const createCameraSlice: Slice<CameraSlice> = (set, get) => ({
  cameraRequest: null,
  requestCamera: (action) => {
    // A command rather than state: a new id each time, so pressing the same button twice still
    // reaches the scene.
    set({ cameraRequest: { action, id: (get().cameraRequest?.id ?? 0) + 1 } });
  },
});

export const useAppStore = create<AppState>()((...args) => ({
  ...createSelectionSlice(...args),
  ...createTimelineSlice(...args),
  ...createQualitySlice(...args),
  ...createAudioSlice(...args),
  ...createIntroSlice(...args),
  ...createCameraSlice(...args),
}));
