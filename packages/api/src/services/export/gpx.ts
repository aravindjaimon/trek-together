import type { RouteRecord } from "../../data/routes.repo";
import type { LatLng } from "../../integrations/elevation/types";
import { haversineM } from "../geo";
import { fromLineString } from "../geojson";

/**
 * Serialize a saved route to GPX 1.1 (T5.2). Pure: route in → string out, no
 * network (all values are precomputed, PRD §5.5). Trackpoints come from the
 * embedded elevation profile — its `distanceAlongM` values are interpolated back
 * onto the stored `path` polyline, so each `<trkpt>` carries a real `<ele>`.
 */
export function toGpx(route: RouteRecord): string {
  const polyline = fromLineString(route.path);
  const trkpts = route.elevationProfile
    .map((sample) => {
      const { lat, lng } = pointAtDistance(polyline, sample.distanceAlongM);
      return `      <trkpt lat="${lat}" lon="${lng}"><ele>${sample.elevationM}</ele></trkpt>`;
    })
    .join("\n");

  const name = escapeXml(route.name);
  const desc = route.description ? `\n    <desc>${escapeXml(route.description)}</desc>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trek Together" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>${desc}
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/** Position at cumulative distance `target` (m) along the polyline (linear interp). */
function pointAtDistance(path: LatLng[], target: number): LatLng {
  const first = path[0];
  if (!first) return { lat: 0, lng: 0 };
  if (target <= 0) return first;

  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (!prev || !curr) continue;
    const seg = haversineM(prev, curr);
    if (acc + seg >= target) {
      const t = seg === 0 ? 0 : (target - acc) / seg;
      return {
        lat: prev.lat + (curr.lat - prev.lat) * t,
        lng: prev.lng + (curr.lng - prev.lng) * t,
      };
    }
    acc += seg;
  }
  return path[path.length - 1] ?? first;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
