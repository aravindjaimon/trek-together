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

/** Tailwind classes per Shenandoah band — greens → reds as difficulty climbs. */
export const BAND_COLORS: Record<DifficultyBand, string> = {
  Easiest: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Moderate: "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30",
  "Moderately Strenuous": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Strenuous: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  "Very Strenuous": "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};
