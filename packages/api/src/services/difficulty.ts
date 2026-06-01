const METRES_TO_FEET = 3.28084;
const METRES_TO_MILES = 1 / 1609.344;

export type DifficultyBand =
  | "Easiest"
  | "Moderate"
  | "Moderately Strenuous"
  | "Strenuous"
  | "Very Strenuous";

export interface DifficultyResult {
  /** Raw Shenandoah numerical score. */
  score: number;
  /** Human-readable band label. */
  band: DifficultyBand;
}

const BANDS: { max: number; label: DifficultyBand }[] = [
  { max: 50, label: "Easiest" },
  { max: 100, label: "Moderate" },
  { max: 150, label: "Moderately Strenuous" },
  { max: 200, label: "Strenuous" },
  { max: Infinity, label: "Very Strenuous" },
];

/**
 * Compute Shenandoah NPS difficulty from ascent (metres) and distance (metres).
 *
 * Converts to feet + miles **at the grading boundary**; internals stay SI.
 *
 * `difficulty = sqrt(2 × gainFt × miles)`
 *
 * Bands (per PROJECT-SPEC.md §5.4):
 * - < 50: Easiest
 * - 50–100: Moderate
 * - 100–150: Moderately Strenuous
 * - 150–200: Strenuous
 * - > 200: Very Strenuous
 *
 * See `docs/decisions/difficulty.md` for the unit-basis rationale.
 */
export function difficulty(ascentM: number, distanceM: number): DifficultyResult {
  const gainFt = ascentM * METRES_TO_FEET;
  const miles = distanceM * METRES_TO_MILES;
  const score = Math.sqrt(2 * gainFt * miles);

  const band = BANDS.find((b) => score < b.max)?.label ?? "Very Strenuous";

  return { score: Math.round(score * 100) / 100, band };
}
