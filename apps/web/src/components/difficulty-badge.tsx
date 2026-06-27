import { BAND_META, type DifficultyBand } from "@/lib/format";

/** 5-tick severity meter — encodes the grade ordinally so it reads without colour. */
function LevelMeter({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-[1px] ${i <= level ? "bg-current" : "bg-current/20"}`}
          style={{ height: `${4 + i * 1.5}px` }}
        />
      ))}
    </span>
  );
}

/**
 * Shenandoah difficulty band as a coloured pill (T7.5). Colour + label + an
 * ordinal meter all encode the grade, so it's legible for colour-blind users.
 */
export function DifficultyBadge({
  band,
  score,
  size = "sm",
}: {
  band: DifficultyBand;
  score?: number;
  size?: "sm" | "lg";
}) {
  const { level, className } = BAND_META[band];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${className} ${
        size === "lg" ? "gap-2 px-3 py-1 text-sm" : "gap-1.5 px-2.5 py-0.5 text-xs"
      }`}
    >
      <LevelMeter level={level} />
      <span className="whitespace-nowrap">{band}</span>
      {score !== undefined && <span className="tnum opacity-75">{score.toFixed(1)}</span>}
    </span>
  );
}
