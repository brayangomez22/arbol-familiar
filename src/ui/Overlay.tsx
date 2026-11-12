import { ZoomControls } from './Controls/ZoomControls';
import { TitleCard, type FamilySummary } from './TitleCard/TitleCard';

interface OverlayProps {
  readonly summary: FamilySummary;
}

/** Everything drawn in DOM over the canvas. */
export function Overlay({ summary }: OverlayProps) {
  return (
    <>
      <TitleCard summary={summary} />
      <ZoomControls />
    </>
  );
}
