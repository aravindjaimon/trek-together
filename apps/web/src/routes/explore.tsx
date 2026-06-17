import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { type LatLng, LeafletMap, type MapMarker } from "@/components/leaflet-map";
import { formatDistance, pathToLatLngs } from "@/lib/format";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

const SHENANDOAH: LatLng = { lat: 38.53, lng: -78.35 };

function ExplorePage() {
  const navigate = useNavigate();
  const [center] = useState<LatLng>(SHENANDOAH);

  const explore = useQuery(
    orpc.routes.explore.queryOptions({
      input: { lat: center.lat, lng: center.lng, radiusM: 50_000, limit: 50 },
    }),
  );

  const items = explore.data?.items ?? [];
  const markers: MapMarker[] = items.flatMap((r) => {
    const start = pathToLatLngs(r.path)[0];
    if (!start) return [];
    return [
      {
        ...start,
        label: `${r.name} · ${formatDistance(r.distanceM)}`,
        onClick: () => navigate({ to: "/r/$id", params: { id: r.id } }),
      },
    ];
  });

  return (
    <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-[1fr_360px]">
      <LeafletMap
        className="h-[45vh] w-full lg:h-full"
        center={center}
        zoom={10}
        markers={markers}
      />

      <aside className="border-t p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <h1 className="text-lg font-semibold">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Public routes near Shenandoah NP ({items.length} found).
        </p>

        {explore.isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}
        {!explore.isLoading && items.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No public routes here yet — save one as public to seed the map.
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => navigate({ to: "/r/$id", params: { id: r.id } })}
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistance(r.distanceM)} · {formatDistance(r.distanceFromQueryM)} away
                  </div>
                </div>
                <DifficultyBadge band={r.difficultyBand} />
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
