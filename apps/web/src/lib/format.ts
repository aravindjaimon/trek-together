import type { AppRouterClient } from "@trek-together/api/routers/index";

/** A saved route as returned by the API (single source of truth for the shape). */
export type Route = Awaited<ReturnType<AppRouterClient["routes"]["getById"]>>;
export type Analysis = Awaited<ReturnType<AppRouterClient["routes"]["analyze"]>>;
export type DifficultyBand = Route["difficultyBand"];

/** GeoJSON `[lng,lat]` coordinates → Leaflet-friendly `{lat,lng}` points. */
export function pathToLatLngs(path: Route["path"]): Array<{ lat: number; lng: number }> {
  return path.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

/** SI is stored internally; convert to human units only at the display edge. */
export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatElevation(m: number): string {
  return `${Math.round(m)} m`;
}

/** Seconds → "Hh Mm" (or "Mm" under an hour). */
export function formatDuration(s: number): string {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

/**
 * Per-band metadata for the difficulty ramp. `level` (1–5) is the ordinal grade
 * — it drives the meter so difficulty never relies on the green→red hue alone.
 * `className` keys off the tokenized `--grade-*` scale (see globals.css), so light
 * and dark stay legible and the whole ramp lives in one place.
 */
export const BAND_META: Record<DifficultyBand, { level: 1 | 2 | 3 | 4 | 5; className: string }> = {
  Easiest: { level: 1, className: "text-grade-1 bg-grade-1/12 border-grade-1/30" },
  Moderate: { level: 2, className: "text-grade-2 bg-grade-2/12 border-grade-2/30" },
  "Moderately Strenuous": { level: 3, className: "text-grade-3 bg-grade-3/12 border-grade-3/30" },
  Strenuous: { level: 4, className: "text-grade-4 bg-grade-4/12 border-grade-4/30" },
  "Very Strenuous": { level: 5, className: "text-grade-5 bg-grade-5/15 border-grade-5/30" },
};
