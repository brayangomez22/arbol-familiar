import { lazy, Suspense, useEffect } from 'react';
import { AudioDirector } from '@/audio/AudioDirector';
import { readLayoutDebugOptions } from '@/scene/debug/layoutDebugOptions';
import { Experience } from '@/scene/Experience';
import { ListPage } from '@/ui/AccessibleList/ListPage';
import { BootLoader } from '@/ui/Loader/BootLoader';
import { dismissBootLoader } from '@/ui/Loader/bootLoader';
import { Overlay } from '@/ui/Overlay';
import { family } from './familyData';
import {
  familyDirectory,
  familyLayout,
  familySummary,
  familyTime,
  fruitLabels,
} from './familyTree';
import { useAmbientParamsSync, wantsAmbientPicker } from './ambientParams';
import { useHashSelection } from './routing';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { supportsWebGL, wantsListOnly } from './webgl';

// Loaded on demand so the developer view never weighs on the real site.
const LayoutDebug = lazy(() =>
  import('@/scene/debug/LayoutDebug').then((module) => ({ default: module.LayoutDebug })),
);

const canDrawTree = supportsWebGL() && !wantsListOnly(window.location.search);

export function App() {
  useHashSelection(familyDirectory.isPerson);
  useAmbientParamsSync();
  const layoutDebug = readLayoutDebugOptions(window.location.search);
  useEffect(() => {
    // The developer view has no intro to hand over to.
    if (layoutDebug) dismissBootLoader(false);
  }, [layoutDebug]);
  if (layoutDebug) {
    return (
      <Suspense fallback={null}>
        <LayoutDebug {...layoutDebug} realFamily={family} />
      </Suspense>
    );
  }
  if (!canDrawTree) return <ListPage family={familyDirectory} reason="no-webgl" />;
  return (
    <SceneErrorBoundary fallback={<ListPage family={familyDirectory} reason="error" />}>
      <BootLoader />
      <AudioDirector />
      <main className="app">
        <Experience layout={familyLayout} labels={fruitLabels} time={familyTime} />
        <Overlay
          summary={familySummary}
          family={familyDirectory}
          ambientPicker={wantsAmbientPicker(window.location.search)}
        />
      </main>
    </SceneErrorBoundary>
  );
}
