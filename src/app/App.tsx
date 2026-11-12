import { lazy, Suspense } from 'react';
import { readLayoutDebugOptions } from '@/scene/debug/layoutDebugOptions';
import { Experience } from '@/scene/Experience';
import { Overlay } from '@/ui/Overlay';
import { familyLayout, fruitLabels } from './familyTree';

// Loaded on demand so the developer view never weighs on the real site.
const LayoutDebug = lazy(() =>
  import('@/scene/debug/LayoutDebug').then((module) => ({ default: module.LayoutDebug })),
);

export function App() {
  const layoutDebug = readLayoutDebugOptions(window.location.search);
  if (layoutDebug) {
    return (
      <Suspense fallback={null}>
        <LayoutDebug {...layoutDebug} />
      </Suspense>
    );
  }
  return (
    <>
      <Experience layout={familyLayout} labels={fruitLabels} />
      <Overlay />
    </>
  );
}
