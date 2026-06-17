import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Checkbox } from "@trek-together/ui/components/checkbox";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { Undo2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { ElevationChart } from "@/components/elevation-chart";
import { type LatLng, LeafletMap } from "@/components/leaflet-map";
import { RouteSummary } from "@/components/route-summary";
import { useSession } from "@/lib/auth-client";
import type { Analysis } from "@/lib/format";
import { client, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [path, setPath] = useState<LatLng[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

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

  function addPoint(p: LatLng) {
    setPath((prev) => [...prev, p]);
    setAnalysis(null);
  }

  return (
    <div className="flex min-h-full flex-col lg:grid lg:h-full lg:grid-cols-[1fr_400px]">
      <LeafletMap className="h-[45vh] w-full lg:h-full" onMapClick={addPoint} polyline={path} />

      <aside className="border-t p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Plan a route</h1>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              disabled={path.length === 0}
              onClick={() => setPath((p) => p.slice(0, -1))}
              aria-label="Undo last point"
            >
              <Undo2 size={16} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={path.length === 0}
              onClick={() => {
                setPath([]);
                setAnalysis(null);
              }}
              aria-label="Clear route"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Click the map to drop waypoints ({path.length} placed).
        </p>

        <Button
          className="mt-4 w-full"
          disabled={path.length < 2 || analyze.isPending}
          onClick={() => analyze.mutate(path)}
        >
          {analyze.isPending ? "Analyzing…" : "Analyze route"}
        </Button>

        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Analysis</h2>
              <DifficultyBadge band={analysis.difficultyBand} score={analysis.difficultyScore} />
            </div>
            <RouteSummary metrics={analysis} />
            <ElevationChart profile={analysis.elevationProfile} />

            <div className="space-y-3 border-t pt-4">
              <h3 className="font-medium">Save</h3>
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
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id="route-public"
                      checked={isPublic}
                      onCheckedChange={(v) => setIsPublic(v === true)}
                    />
                    <Label htmlFor="route-public" className="font-normal">
                      Make public (shareable by link)
                    </Label>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!name.trim() || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    {save.isPending ? "Saving…" : "Save route"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <a href="/login" className="text-foreground underline">
                    Sign in
                  </a>{" "}
                  to save this route.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
