import { useThree } from '@react-three/fiber';
import { useEffect, useImperativeHandle, useMemo, type Ref } from 'react';
import { Vector2 } from 'three';
import { TOON } from '@/config/constants';
import { dayPalette } from '@/config/theme';
import type { BranchSegment } from '@/layout/types';
import { OutlineMaterial } from '../materials/OutlineMaterial';
import { ToonMaterial, type SapUniforms } from '../materials/ToonMaterial';
import { buildBranchGeometry, setSapLimits, type WoodMeasure } from './branchGeometry';

/** What a selection drives on the branches: the sap uniforms and which wood carries it. */
export interface BranchMeshHandle {
  readonly sap: SapUniforms;
  showLineage(limits: ReadonlyMap<string, number> | null): void;
}

interface BranchMeshProps {
  readonly segments: readonly BranchSegment[];
  readonly color: string;
  /** Reach and wind weight along the wood; without it the wood stays still and carries no sap. */
  readonly wood?: WoodMeasure;
  readonly ref?: Ref<BranchMeshHandle>;
}

/** A set of branches (or roots) as one solid mesh of toon-shaded bark with an ink outline. */
export function BranchMesh({ segments, color, wood, ref }: BranchMeshProps) {
  const built = useMemo(() => buildBranchGeometry(segments, wood), [segments, wood]);
  const material = useMemo(
    () =>
      new ToonMaterial({
        color,
        palette: dayPalette,
        bark: true,
        wind: true,
        focus: true,
        sap: wood !== undefined,
      }),
    [color, wood],
  );
  const outline = useMemo(
    () =>
      new OutlineMaterial({
        color: dayPalette.outline,
        thickness: TOON.outline.branchThickness,
        wind: true,
      }),
    [],
  );
  useEffect(
    () => () => {
      built.geometry.dispose();
    },
    [built],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  useEffect(
    () => () => {
      outline.dispose();
    },
    [outline],
  );

  useImperativeHandle(
    ref,
    () => ({
      sap: material.sap,
      showLineage: (limits) => {
        setSapLimits(built, limits);
      },
    }),
    [material, built],
  );

  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  useEffect(() => {
    const buffer = gl.getDrawingBufferSize(new Vector2());
    outline.setResolution(buffer.x, buffer.y);
  }, [gl, outline, size, pixelRatio]);

  return (
    <>
      <mesh geometry={built.geometry} material={material} />
      <mesh geometry={built.geometry} material={outline} />
    </>
  );
}
