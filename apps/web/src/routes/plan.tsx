import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Checkbox } from "@trek-together/ui/components/checkbox";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { LocateFixed, MousePointerClick, Undo2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { ElevationChart } from "@/components/elevation-chart";
import { type LatLng, LeafletMap } from "@/components/leaflet-map";
import { RouteSummary } from "@/components/route-summary";
import { useSession } from "@/lib/auth-client";
import type { Analysis } from "@/lib/format";
import { useGeolocate } from "@/lib/use-geolocate";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  // `waypoints` are the user's clicks; `path` is the trail-snapped geometry we
  // draw, analyse, and save. They diverge once snapping succeeds.
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [path, setPath] = useState<LatLng[]>([]);
  const [fitTo, setFitTo] = useState<LatLng[]>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const { locate, isLocating } = useGeolocate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const snap = useMutation({
    mutationFn: (wp: LatLng[]) => client.routes.snap({ waypoints: wp }),
  });

  const analyze = useMutation({
    mutationFn: (p: LatLng[]) => client.routes.analyze({ path: p }),
    onSuccess: (result) => setAnalysis(result),
    onError: (e) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: () =>
      client.routes.create({ path, name, description: description || null, isPublic }),
    onSuccess: (route) => {
      toast.success("Route saved");
      queryClient.invalidateQueries({ queryKey: [["routes", "listMine"]] });
      navigate({ to: "/r/$id", params: { id: route.id } });
    },
    onError: (e) => toast.error(e.message),
  });

  // Set the waypoints and recompute the snapped path. <2 points can't be routed,
  // so the path mirrors the clicks; on a snapping failure we fall back to a
  // straight line so planning always works.
  function commit(next: LatLng[]) {
    setWaypoints(next);
    setAnalysis(null);
    if (next.length < 2) {
      setPath(next);
      return;
    }
    snap.mutate(next, {
      onSuccess: (r) => setPath(r.path),
      onError: () => {
        setPath(next);
        toast.error("Couldn't follow a trail — showing a straight line.");
      },
    });
  }

  return (
    <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-[1fr_408px]">
      <div className="relative h-[45vh] w-full lg:h-full">
        <LeafletMap
          className="h-full w-full"
          onMapClick={(p) => commit([...waypoints, p])}
          polyline={path}
          waypoints={waypoints}
          fitTo={fitTo}
        />
        {waypoints.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
              <MousePointerClick size={15} className="text-trail" />
              Tap the map to drop your first waypoint
            </div>
          </div>
        )}
      </div>

      <aside className="flex flex-col border-t border-border bg-sidebar p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Plan a route</h1>
            <p className="tnum mt-0.5 text-sm text-muted-foreground">
              {snap.isPending
                ? "Following trails…"
                : `${waypoints.length} waypoint${waypoints.length === 1 ? "" : "s"} placed`}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="icon"
              variant="outline"
              disabled={isLocating}
              onClick={() =>
                locate((p) => {
                  commit([...waypoints, p]);
                  setFitTo([p]);
                })
              }
              aria-label="Use my location"
            >
              <LocateFixed size={16} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={waypoints.length === 0}
              onClick={() => commit(waypoints.slice(0, -1))}
              aria-label="Undo last point"
            >
              <Undo2 size={16} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={waypoints.length === 0}
              onClick={() => commit([])}
              aria-label="Clear route"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        <Button
          className="mt-4 h-11 w-full text-sm"
          disabled={path.length < 2 || analyze.isPending || snap.isPending}
          onClick={() => analyze.mutate(path)}
        >
          {analyze.isPending ? "Analyzing…" : "Analyze route"}
        </Button>
        {waypoints.length < 2 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Place at least two waypoints to analyze.
          </p>
        )}

        {analysis && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
                Analysis
              </h2>
              <DifficultyBadge
                band={analysis.difficultyBand}
                score={analysis.difficultyScore}
                size="lg"
              />
            </div>
            <RouteSummary metrics={analysis} />

            <div>
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">
                Elevation profile
              </h3>
              <ElevationChart profile={analysis.elevationProfile} />
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="text-sm font-semibold tracking-tight">Save this route</h3>
              {session ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="route-name">Name</Label>
                    <Input
                      id="route-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Old Rag Loop"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="route-desc">Description</Label>
                    <textarea
                      id="route-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Optional notes for anyone you share this with."
                      className="w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-input/30"
                    />
                  </div>
                  <label
                    htmlFor="route-public"
                    className="flex items-center gap-2.5 rounded-sm border border-border bg-card p-3 text-sm"
                  >
                    <Checkbox
                      id="route-public"
                      checked={isPublic}
                      onCheckedChange={(v) => setIsPublic(v === true)}
                    />
                    <span>
                      <span className="font-medium">Make public</span>
                      <span className="block text-xs text-muted-foreground">
                        Shareable by link and shown in Explore.
                      </span>
                    </span>
                  </label>
                  <Button
                    className="h-10 w-full text-sm"
                    disabled={!name.trim() || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    {save.isPending ? "Saving…" : "Save route"}
                  </Button>
                </>
              ) : (
                <div className="rounded-sm border border-border bg-card p-4 text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to save this route and share it by link.
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
