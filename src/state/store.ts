import { create, type StateCreator } from 'zustand';
import { DEFAULT_QUALITY_TIER, type QualityTier } from '@/config/quality';
import { loadAudioPreference, saveAudioPreference } from './audioMemory';
import type { DayPhase } from '@/domain/dayCycle';
import type { Season } from '@/domain/seasons';
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
  /** ▶ is running through the years. */
  timelinePlaying: boolean;
  setTimelineYear: (year: number | null) => void;
  setTimelinePlaying: (playing: boolean) => void;
}

/** Season and time of day forced from the URL (?season=, ?time=); null follows the clock. */
export interface AmbientSlice {
  seasonOverride: Season | null;
  dayPhaseOverride: DayPhase | null;
  setSeasonOverride: (season: Season | null) => void;
  setDayPhaseOverride: (phase: DayPhase | null) => void;
}

export interface QualitySlice {
  qualityTier: QualityTier;
  setQualityTier: (tier: QualityTier) => void;
}

export interface AudioSlice {
  audioEnabled: boolean;
  /** A person's voice note is playing: the ambient music steps aside while it does. */
  voiceNotePlaying: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  setVoiceNotePlaying: (playing: boolean) => void;
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

/** CSS pixels of the view covered by the person panel, on the right and at the bottom. */
export interface ViewInset {
  readonly right: number;
  readonly bottom: number;
}

export interface CameraSlice {
  /** Latest command from the UI for the scene's camera. */
  cameraRequest: CameraRequest | null;
  /**
   * Where the person panel sits whenever someone is selected, so a flight frames the person in the
   * part of the view it leaves free.
   */
  viewInset: ViewInset;
  requestCamera: (action: CameraAction) => void;
  setViewInset: (inset: ViewInset) => void;
}

export interface PhotoSlice {
  /** The UI steps aside so the visitor can frame the tree. */
  photoMode: boolean;
  /** Bumped by the UI to ask the scene for a picture; 0 means none asked yet. */
  photoRequest: number;
  /** The last picture the scene took, as it came off the canvas. */
  photo: Blob | null;
  setPhotoMode: (on: boolean) => void;
  requestPhoto: () => void;
  setPhoto: (photo: Blob | null) => void;
}

export type AppState = SelectionSlice &
  TimelineSlice &
  AmbientSlice &
  QualitySlice &
  AudioSlice &
  IntroSlice &
  CameraSlice &
  PhotoSlice;

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
  timelinePlaying: false,
  setTimelineYear: (year) => {
    set({ timelineYear: year });
  },
  setTimelinePlaying: (playing) => {
    set({ timelinePlaying: playing });
  },
});

const createAmbientSlice: Slice<AmbientSlice> = (set) => ({
  seasonOverride: null,
  dayPhaseOverride: null,
  setSeasonOverride: (season) => {
    set({ seasonOverride: season });
  },
  setDayPhaseOverride: (phase) => {
    set({ dayPhaseOverride: phase });
  },
});

const createQualitySlice: Slice<QualitySlice> = (set) => ({
  qualityTier: DEFAULT_QUALITY_TIER,
  setQualityTier: (tier) => {
    set({ qualityTier: tier });
  },
});

const createAudioSlice: Slice<AudioSlice> = (set) => ({
  // Off unless the visitor left it on. Even then nothing sounds before their first click or key
  // (see audio/AudioDirector): browsers forbid it, and it would be rude anyway.
  audioEnabled: loadAudioPreference(),
  voiceNotePlaying: false,
  setAudioEnabled: (enabled) => {
    saveAudioPreference(enabled);
    set({ audioEnabled: enabled });
  },
  setVoiceNotePlaying: (playing) => {
    set({ voiceNotePlaying: playing });
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
  viewInset: { right: 0, bottom: 0 },
  setViewInset: (inset) => {
    const current = get().viewInset;
    if (current.right !== inset.right || current.bottom !== inset.bottom) set({ viewInset: inset });
  },
  requestCamera: (action) => {
    // A command rather than state: a new id each time, so pressing the same button twice still
    // reaches the scene.
    set({ cameraRequest: { action, id: (get().cameraRequest?.id ?? 0) + 1 } });
  },
});

const createPhotoSlice: Slice<PhotoSlice> = (set, get) => ({
  photoMode: false,
  photoRequest: 0,
  photo: null,
  setPhotoMode: (on) => {
    set({ photoMode: on, photo: null });
  },
  requestPhoto: () => {
    set({ photoRequest: get().photoRequest + 1 });
  },
  setPhoto: (photo) => {
    set({ photo });
  },
});

export const useAppStore = create<AppState>()((...args) => ({
  ...createSelectionSlice(...args),
  ...createTimelineSlice(...args),
  ...createAmbientSlice(...args),
  ...createQualitySlice(...args),
  ...createAudioSlice(...args),
  ...createIntroSlice(...args),
  ...createCameraSlice(...args),
  ...createPhotoSlice(...args),
}));
