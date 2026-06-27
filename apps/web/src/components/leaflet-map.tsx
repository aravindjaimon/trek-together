import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker extends LatLng {
  label?: string;
  onClick?: () => void;
}

interface LeafletMapProps {
  className?: string;
  center?: LatLng;
  zoom?: number;
  /** Click handler for planner mode (adds a vertex). */
  onMapClick?: (p: LatLng) => void;
  /** Ordered polyline to draw (the route). */
  polyline?: LatLng[];
  /** Standalone markers (explore results). */
  markers?: MapMarker[];
  /** When set, the map fits its view to these points on change. */
  fitTo?: LatLng[];
}

const DEFAULT_CENTER: LatLng = { lat: 38.53, lng: -78.35 }; // Shenandoah NP
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Thin React wrapper over vanilla Leaflet (T7.3). Renders an OSM base map and
 * reactively redraws a polyline + markers from props. Uses circleMarkers/polyline
 * (not default icon markers) to avoid Leaflet's bundler icon-asset problem.
 */
export function LeafletMap({
  className,
  center = DEFAULT_CENTER,
  zoom = 12,
  onMapClick,
  polyline,
  markers,
  fitTo,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([center.lat, center.lng], zoom);
    L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw polyline + markers whenever they change.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    // Pull live theme tokens so the map matches the design system.
    const css = getComputedStyle(document.documentElement);
    const trail = css.getPropertyValue("--trail").trim() || "#e8621f";
    const brand = css.getPropertyValue("--primary").trim() || "#3f8f5f";

    if (polyline && polyline.length > 0) {
      const latlngs = polyline.map((p) => [p.lat, p.lng] as [number, number]);
      if (latlngs.length > 1) {
        // Dark casing under the blaze line keeps the route legible over any tile.
        L.polyline(latlngs, { color: "rgba(20,25,20,0.35)", weight: 8, lineJoin: "round" }).addTo(
          layer,
        );
        L.polyline(latlngs, { color: trail, weight: 4, lineJoin: "round" }).addTo(layer);
      }
      for (const p of polyline) {
        L.circleMarker([p.lat, p.lng], {
          radius: 5,
          color: "#fff",
          weight: 2,
          fillColor: trail,
          fillOpacity: 1,
        }).addTo(layer);
      }
    }

    for (const m of markers ?? []) {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: brand,
        fillOpacity: 1,
      }).addTo(layer);
      if (m.label) marker.bindPopup(m.label);
      if (m.onClick) marker.on("click", m.onClick);
    }
  }, [polyline, markers]);

  // Fit bounds when requested.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitTo || fitTo.length === 0) return;
    const bounds = L.latLngBounds(fitTo.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [fitTo]);

  return <div ref={containerRef} className={className} />;
}
