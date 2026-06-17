import { formatDistance, formatElevation } from "@/lib/format";

interface ProfilePoint {
  distanceAlongM: number;
  elevationM: number;
}

/**
 * Elevation profile as a self-contained inline SVG area chart (T7.4) — no chart
 * dependency. Distance on x, elevation on y, both auto-scaled to the data range.
 */
export function ElevationChart({ profile }: { profile: ProfilePoint[] }) {
  const W = 640;
  const H = 200;
  const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

  if (profile.length < 2) {
    return <p className="text-sm text-muted-foreground">Not enough data to chart.</p>;
  }

  const maxDist = profile[profile.length - 1]?.distanceAlongM ?? 1;
  const elevs = profile.map((p) => p.elevationM);
  const minEl = Math.min(...elevs);
  const maxEl = Math.max(...elevs);
  const elRange = maxEl - minEl || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (d: number) => PAD.left + (d / maxDist) * innerW;
  const y = (e: number) => PAD.top + innerH - ((e - minEl) / elRange) * innerH;

  const line = profile.map((p) => `${x(p.distanceAlongM)},${y(p.elevationM)}`).join(" ");
  const area = `${PAD.left},${PAD.top + innerH} ${line} ${PAD.left + innerW},${PAD.top + innerH}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Elevation profile"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Elevation profile</title>
      {/* y-axis min/max labels + gridlines */}
      {[minEl, (minEl + maxEl) / 2, maxEl].map((e) => (
        <g key={e}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(e)}
            y2={y(e)}
            className="stroke-border"
            strokeWidth={1}
          />
          <text x={4} y={y(e) + 4} className="fill-muted-foreground text-[10px]">
            {formatElevation(e)}
          </text>
        </g>
      ))}
      {/* x-axis start/end distance */}
      <text x={PAD.left} y={H - 6} className="fill-muted-foreground text-[10px]">
        0
      </text>
      <text
        x={W - PAD.right}
        y={H - 6}
        textAnchor="end"
        className="fill-muted-foreground text-[10px]"
      >
        {formatDistance(maxDist)}
      </text>
      <polygon points={area} className="fill-emerald-500/20" />
      <polyline points={line} className="fill-none stroke-emerald-500" strokeWidth={2} />
    </svg>
  );
}
