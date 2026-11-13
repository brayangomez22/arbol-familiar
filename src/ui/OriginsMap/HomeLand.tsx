import { useId } from 'react';
import { originsMapPalette as palette } from '@/config/theme';
import type { HomePanel } from '@/layout/originsMap';
import { closedPath, mountainPath, openPath } from './mapPaths';

interface HomeLandProps {
  readonly panel: HomePanel;
}

/** Ripples ringing the coast, widest first, as engraved on old charts. */
const RIPPLES = [22, 14, 7] as const;

/**
 * Colombia on paper: a sea of soft ripples, the land with a wobbly hand-inked coast, the
 * Magdalena, little mountains along the cordilleras and the names of the seas.
 */
export function HomeLand({ panel }: HomeLandProps) {
  const id = useId();
  const coast = panel.land.map(closedPath).join('');
  const mountainSize = panel.width * 0.011;

  return (
    <g aria-hidden="true">
      <defs>
        {/* A touch of displacement turns the smooth outline into a pen line. */}
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
        <radialGradient id={`${id}-land`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor={palette.land} />
          <stop offset="100%" stopColor={palette.landShade} />
        </radialGradient>
      </defs>
      <rect width={panel.width} height={panel.height} rx={18} fill={palette.sea} />
      {RIPPLES.map((width, rank) => (
        <path
          key={width}
          d={coast}
          fill="none"
          stroke={palette.seaInk}
          strokeWidth={width}
          strokeLinejoin="round"
          opacity={0.07 + rank * 0.05}
        />
      ))}
      <g filter={`url(#${id}-ink)`}>
        <path
          d={coast}
          fill={`url(#${id}-land)`}
          stroke={palette.coast}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <path
          d={openPath(panel.river)}
          fill="none"
          stroke={palette.river}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <g
          fill="none"
          stroke={palette.mountain}
          strokeWidth={1.3}
          strokeLinejoin="round"
          opacity={0.6}
        >
          {panel.mountains.map((at) => (
            <path key={`${at.x},${at.y}`} d={mountainPath(at, mountainSize)} />
          ))}
        </g>
      </g>
      {panel.seas.map(({ name, at }) => (
        <text
          key={name}
          x={at.x}
          y={at.y}
          fill={palette.seaInk}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fontSize={panel.width * 0.026}
          letterSpacing="0.08em"
        >
          {name.split('\n').map((line, row) => (
            <tspan key={line} x={at.x} dy={row === 0 ? 0 : '1.2em'}>
              {line}
            </tspan>
          ))}
        </text>
      ))}
      <Compass x={panel.width * 0.1} y={panel.height * 0.9} size={panel.width * 0.045} />
    </g>
  );
}

function Compass({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={palette.coast} opacity={0.55}>
      <path d={`M0 ${-size}L${size * 0.22} 0L0 ${size}L${-size * 0.22} 0Z`} />
      <path
        d={`M${-size * 0.7} 0L0 ${size * 0.16}L${size * 0.7} 0L0 ${-size * 0.16}Z`}
        opacity={0.6}
      />
      <text
        y={-size * 1.25}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={size * 0.55}
        fontWeight={600}
      >
        N
      </text>
    </g>
  );
}
