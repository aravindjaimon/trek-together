import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Skeleton } from "@trek-together/ui/components/skeleton";
import { Download, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { ElevationChart } from "@/components/elevation-chart";
import { LeafletMap } from "@/components/leaflet-map";
import { RouteSummary } from "@/components/route-summary";
import { useSession } from "@/lib/auth-client";
import { downloadText } from "@/lib/download";
import { pathToLatLngs } from "@/lib/format";
import { client, orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/r/$id")({
  component: RouteViewPage,
});

function RouteViewPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const query = useQuery(orpc.routes.getById.queryOptions({ input: { id } }));

  const exportMut = useMutation({
    mutationFn: (format: "gpx" | "json") => client.routes.exportItinerary({ id, format }),
    onSuccess: (payload) => downloadText(payload.filename, payload.contentType, payload.content),
    onError: (e) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => client.routes.remove({ id }),
    onSuccess: () => {
      toast.success("Route deleted");
      queryClient.invalidateQueries({ queryKey: [["routes", "listMine"]] });
      navigate({ to: "/routes" });
    },
    onError: (e) => toast.error(e.message),
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn’t copy the link");
    }
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-[360px] w-full" />
        <Skeleton className="mt-6 h-20 w-full" />
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Route unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            This route is private or doesn’t exist. It may have been deleted, or the link isn’t
            shared publicly.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            render={<Link to="/explore">Explore public routes</Link>}
          />
        </div>
      </div>
    );
  }

  const route = query.data;
  const latlngs = pathToLatLngs(route.path);
  const isOwner = session?.user.id === route.ownerId;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance">{route.name}</h1>
          {route.description && (
            <p className="mt-1.5 max-w-2xl text-muted-foreground text-pretty">
              {route.description}
            </p>
          )}
        </div>
        <DifficultyBadge band={route.difficultyBand} score={route.difficultyScore} size="lg" />
      </div>

      <LeafletMap
        className="mt-5 h-[360px] w-full overflow-hidden rounded-lg border border-border"
        polyline={latlngs}
        fitTo={latlngs}
      />

      <div className="mt-5">
        <RouteSummary metrics={route} />
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">
          Elevation profile
        </h2>
        <div className="rounded-md border border-border bg-card p-4">
          <ElevationChart profile={route.elevationProfile} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={copyLink}>
          <Link2 size={16} /> Copy link
        </Button>
        <Button
          variant="outline"
          onClick={() => exportMut.mutate("gpx")}
          disabled={exportMut.isPending}
        >
          <Download size={16} /> GPX
        </Button>
        <Button
          variant="outline"
          onClick={() => exportMut.mutate("json")}
          disabled={exportMut.isPending}
        >
          <Download size={16} /> JSON
        </Button>
        {isOwner && (
          <Button
            variant="destructive"
            className="ml-auto"
            onClick={() => del.mutate()}
            disabled={del.isPending}
          >
            <Trash2 size={16} /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}
