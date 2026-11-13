import { ORIGINS_MAP } from '@/config/constants';
import { originsMapPalette as palette } from '@/config/theme';
import type { WorldPanel } from '@/layout/originsMap';
import { closedPath } from './mapPaths';

interface WorldLandProps {
  readonly panel: WorldPanel;
}

/** The continents as soft blots, and home marked with a ring, where the lines from abroad arrive. */
export function WorldLand({ panel }: WorldLandProps) {
  const ring = ORIGINS_MAP.place.radius * ORIGINS_MAP.place.worldScale;
  return (
    <g aria-hidden="true">
      <rect width={panel.width} height={panel.height} rx={12} fill={palette.sea} />
      <path
        d={panel.land.map(closedPath).join('')}
        fill={palette.land}
        stroke={palette.coast}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <circle
        cx={panel.home.x}
        cy={panel.home.y}
        r={ring}
        fill={palette.place}
        stroke={palette.placeText}
        strokeWidth={1.5}
      />
      <text
        x={panel.home.x - ring - 3}
        y={panel.home.y + ring + 10}
        textAnchor="end"
        fill={palette.coast}
        fontFamily="var(--font-display)"
        fontSize={11}
        fontWeight={600}
      >
        {ORIGINS_MAP.homeCountry}
      </text>
    </g>
  );
}
