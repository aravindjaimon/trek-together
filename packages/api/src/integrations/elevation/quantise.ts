import { QUANTISE_GRID_DEG } from "./constants";
import type { LatLng } from "./types";

/** Round a single degree value to the nearest grid node. */
export function quantiseCoord(deg: number, gridDeg: number = QUANTISE_GRID_DEG): number {
  return Math.round(deg / gridDeg) * gridDeg;
}

/**
 * Snap a point to the nearest quantisation-grid node (default 1 arc-second ≈
 * 30 m), so densified sample points within one dataset cell collapse to a
 * single cache key.
 */
export function quantise(point: LatLng, gridDeg: number = QUANTISE_GRID_DEG): LatLng {
  return {
    lat: quantiseCoord(point.lat, gridDeg),
    lng: quantiseCoord(point.lng, gridDeg),
  };
}

/**
 * Build the cache key for a quantised point under a dataset namespace:
 * `"<datasetNamespace>:<qlat>,<qlng>"`. Coordinates are formatted to fixed
 * precision (finer than the grid step) so float-representation noise can't
 * produce two keys for the same grid node.
 */
export function cacheKey(datasetNamespace: string, quantised: LatLng): string {
  return `${datasetNamespace}:${quantised.lat.toFixed(6)},${quantised.lng.toFixed(6)}`;
}
