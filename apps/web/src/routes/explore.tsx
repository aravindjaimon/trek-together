import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Skeleton } from "@trek-together/ui/components/skeleton";
import { LocateFixed, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { type LatLng, LeafletMap, type MapMarker } from "@/components/leaflet-map";
import { QueryErrorCard } from "@/components/query-error-card";
import { formatDistance, pathToLatLngs } from "@/lib/format";
import { useGeolocate } from "@/lib/use-geolocate";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

const SHENANDOAH: LatLng = { lat: 38.53, lng: -78.35 };

function ExplorePage() {
  const navigate = useNavigate();
  const [center, setCenter] = useState<LatLng>(SHENANDOAH);
  const [located, setLocated] = useState<LatLng>();
  const { locate, isLocating } = useGeolocate();

  const explore = useQuery({
    ...orpc.routes.explore.queryOptions({
      input: { lat: center.lat, lng: center.lng, radiusM: 50_000, limit: 50 },
    }),
    // The inline error card below is the signal — no global toast (T10.12).
    meta: { silentError: true },
  });

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

  // After "Near me", fit to the located point plus the result pins around it —
  // not a lone point at max zoom — re-fitting once the recentred results land.
  const fitTo = useMemo<LatLng[] | undefined>(() => {
    if (!located) return undefined;
    const starts = (explore.data?.items ?? []).flatMap((r) => {
      const start = pathToLatLngs(r.path)[0];
      return start ? [start] : [];
    });
    return [located, ...starts];
  }, [located, explore.data]);

  return (
    <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-[1fr_372px]">
      <LeafletMap
        className="h-[45vh] w-full lg:h-full"
        center={center}
        zoom={10}
        markers={markers}
        fitTo={fitTo}
      />

      <aside className="flex flex-col border-t border-border bg-sidebar p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-base font-semibold tracking-tight">Explore</h1>
          <div className="flex items-center gap-2.5">
            {!explore.isLoading && !explore.isError && (
              <span className="tnum text-sm text-muted-foreground">
                {items.length} route{items.length === 1 ? "" : "s"}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isLocating}
              onClick={() =>
                locate((p) => {
                  setCenter(p);
                  setLocated(p);
                })
              }
            >
              <LocateFixed size={15} />
              Near me
            </Button>
          </div>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {located ? "Public routes near you." : "Public routes near Shenandoah NP."}
        </p>

        {explore.isLoading && (
          <ul className="mt-5 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="rounded-md border border-border bg-card p-3.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </li>
            ))}
          </ul>
        )}

        {explore.isError && (
          <QueryErrorCard
            title="Couldn’t load nearby routes"
            body="Something went wrong reaching the server. Your connection or the service may be down."
            onRetry={() => explore.refetch()}
          />
        )}

        {!explore.isLoading && !explore.isError && items.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-card px-6 py-10 text-center">
            <MapPin size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-pretty">
              No public routes here yet. Plot one and mark it public to put the first pin on the
              map.
            </p>
            <Button size="sm" variant="outline" render={<Link to="/plan">Plan a route</Link>} />
          </div>
        )}

        <ul className="mt-5 space-y-2.5">
          {items.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => navigate({ to: "/r/$id", params: { id: r.id } })}
                className="group flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="tnum mt-0.5 text-xs text-muted-foreground">
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
