import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Download, Trash2 } from "lucide-react";
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

  if (query.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 text-muted-foreground">Loading…</div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted-foreground">This route is private or doesn’t exist.</p>
        <Button
          variant="outline"
          className="mt-4"
          render={<Link to="/explore">Explore public routes</Link>}
        />
      </div>
    );
  }

  const route = query.data;
  const latlngs = pathToLatLngs(route.path);
  const isOwner = session?.user.id === route.ownerId;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{route.name}</h1>
          {route.description && <p className="mt-1 text-muted-foreground">{route.description}</p>}
        </div>
        <DifficultyBadge band={route.difficultyBand} score={route.difficultyScore} />
      </div>

      <LeafletMap
        className="mt-4 h-[360px] w-full rounded-lg border"
        polyline={latlngs}
        fitTo={latlngs}
      />

      <div className="mt-6 rounded-lg border p-4">
        <RouteSummary metrics={route} />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-medium">Elevation profile</h2>
        <ElevationChart profile={route.elevationProfile} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
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
            variant="outline"
            className="ml-auto text-red-600"
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
