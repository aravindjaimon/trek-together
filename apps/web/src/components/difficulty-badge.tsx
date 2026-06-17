import { BAND_COLORS, type DifficultyBand } from "@/lib/format";

/** Shenandoah difficulty band + numeric score as a coloured pill (T7.5). */
export function DifficultyBadge({ band, score }: { band: DifficultyBand; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BAND_COLORS[band]}`}
    >
      {band}
      {score !== undefined && <span className="opacity-70">· {score.toFixed(1)}</span>}
    </span>
  );
}
