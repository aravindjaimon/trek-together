import { useId } from "react";

import { formatDistance, formatElevation } from "@/lib/format";

interface ProfilePoint {
  distanceAlongM: number;
  elevationM: number;
}

/**
 * Elevation profile as a self-contained inline SVG (T7.4) — no chart dependency.
 * Trail-orange stroke matches the route line on the map (same route, same colour);
 * the line draws itself in on mount. Distance on x, elevation on y, auto-scaled.
 */
export function ElevationChart({ profile }: { profile: ProfilePoint[] }) {
  const gradId = useId();
  const W = 640;
  const H = 208;
  const PAD = { top: 16, right: 14, bottom: 26, left: 48 };

  if (profile.length < 2) {
    return (
      <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        Not enough data to chart.
      </div>
    );
  }

  const maxDist = profile[profile.length - 1]?.distanceAlongM ?? 1;
  // reduce, not Math.min(...spread): a long profile would blow the argument-count
  // limit (RangeError), and this is a single pass either way.
  let minEl = profile[0]?.elevationM ?? 0;
  let maxEl = minEl;
  for (const p of profile) {
    if (p.elevationM < minEl) minEl = p.elevationM;
    if (p.elevationM > maxEl) maxEl = p.elevationM;
  }
  const elRange = maxEl - minEl || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (d: number) => PAD.left + (d / maxDist) * innerW;
  const y = (e: number) => PAD.top + innerH - ((e - minEl) / elRange) * innerH;

  const line = profile.map((p) => `${x(p.distanceAlongM)},${y(p.elevationM)}`).join(" ");
  const area = `${PAD.left},${PAD.top + innerH} ${line} ${PAD.left + innerW},${PAD.top + innerH}`;

  // Peak marker — the single most useful landmark on the profile.
  const peak = profile.reduce((a, b) => (b.elevationM > a.elevationM ? b : a));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full overflow-visible"
      role="img"
      aria-label={`Elevation profile: ${formatElevation(minEl)} to ${formatElevation(maxEl)} over ${formatDistance(maxDist)}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Elevation profile</title>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--trail)", stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: "var(--trail)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* y-axis gridlines + labels */}
      {[minEl, (minEl + maxEl) / 2, maxEl].map((e) => (
        <g key={e}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(e)}
            y2={y(e)}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray={e === minEl ? "0" : "3 4"}
          />
          <text
            x={PAD.left - 8}
            y={y(e) + 3.5}
            textAnchor="end"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {Math.round(e)}
          </text>
        </g>
      ))}

      {/* x-axis start / end distance */}
      <text x={PAD.left} y={H - 8} className="fill-muted-foreground font-mono text-[10px]">
        0
      </text>
      <text
        x={W - PAD.right}
        y={H - 8}
        textAnchor="end"
        className="fill-muted-foreground font-mono text-[10px]"
      >
        {formatDistance(maxDist)}
      </text>

      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        className="animate-trail-draw fill-none stroke-trail"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ "--trail-len": "2000" } as React.CSSProperties}
      />

      {/* Peak marker */}
      <g>
        <circle
          cx={x(peak.distanceAlongM)}
          cy={y(peak.elevationM)}
          r={3.5}
          className="fill-background stroke-trail"
          strokeWidth={2}
        />
        <text
          x={x(peak.distanceAlongM)}
          y={y(peak.elevationM) - 9}
          textAnchor="middle"
          className="fill-foreground font-mono text-[10px] font-medium"
        >
          {formatElevation(peak.elevationM)}
        </text>
      </g>
    </svg>
  );
}
