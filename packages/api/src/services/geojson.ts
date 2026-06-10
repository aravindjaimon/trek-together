import type { LatLng } from "../integrations/elevation/types";

/**
 * GeoJSON LineString — the on-disk geometry shape for a saved route's `path`
 * (stored in a Prisma `Json` field, T4.1). Coordinates are **`[lng, lat]`**, the
 * order GeoJSON and MongoDB's `2dsphere` index require — the inverse of our
 * in-app `{ lat, lng }`. These two converters are the single place that ordering
 * flip happens.
 */
export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

/** In-app polyline (`{lat,lng}[]`) → GeoJSON LineString (`[lng,lat]` coords). */
export function toLineString(path: LatLng[]): GeoJSONLineString {
  return { type: "LineString", coordinates: path.map((p) => [p.lng, p.lat]) };
}

/** GeoJSON LineString (`[lng,lat]` coords) → in-app polyline (`{lat,lng}[]`). */
export function fromLineString(line: GeoJSONLineString): LatLng[] {
  return line.coordinates.map(([lng, lat]) => ({ lat, lng }));
}
