import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Skeleton } from "@trek-together/ui/components/skeleton";
import { Globe, Plus } from "lucide-react";

import { DifficultyBadge } from "@/components/difficulty-badge";
import { QueryErrorCard } from "@/components/query-error-card";
import { useSession } from "@/lib/auth-client";
import { formatDistance } from "@/lib/format";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/routes")({
  component: MyRoutesPage,
});

function MyRoutesPage() {
  const { data: session, isPending } = useSession();
  const list = useQuery({
    ...orpc.routes.listMine.queryOptions({ input: { page: 1, limit: 50 } }),
    enabled: !!session,
    // The inline error card below is the signal — no global toast (T10.12).
    meta: { silentError: true },
  });

  if (!isPending && !session) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Your saved routes</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Sign in to keep your planned routes, revisit their analysis, and share them by link.
          </p>
          <Button className="mt-5" render={<Link to="/login">Sign in</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My Routes</h1>
        <Button render={<Link to="/plan" />}>
          <Plus size={16} /> Plan new
        </Button>
      </div>

      {list.isLoading && (
        <ul className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-md border border-border bg-card p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-2.5 h-3.5 w-1/3" />
            </li>
          ))}
        </ul>
      )}

      {list.isError && (
        <QueryErrorCard
          title="Couldn’t load your routes"
          body="Something went wrong reaching the server. Your saved routes are safe — try again in a moment."
          onRetry={() => list.refetch()}
        />
      )}

      {list.data && list.data.items.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">No routes yet.</p>
          <Button variant="outline" render={<Link to="/plan">Plan your first route</Link>} />
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {list.data?.items.map((r) => (
          <li key={r.id}>
            <Link
              to="/r/$id"
              params={{ id: r.id }}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{r.name}</span>
                  {r.isPublic && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      <Globe size={11} /> Public
                    </span>
                  )}
                </div>
                <div className="tnum mt-0.5 text-sm text-muted-foreground">
                  {formatDistance(r.distanceM)}
                </div>
              </div>
              <DifficultyBadge band={r.difficultyBand} score={r.difficultyScore} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
