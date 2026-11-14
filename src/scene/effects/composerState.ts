/**
 * Whether the effect composer is drawing the frames. Kept apart from Effects.tsx, which loads
 * lazily, so the photo capture can ask without pulling postprocessing into the first bundle.
 */
export const composerState = { active: false };
