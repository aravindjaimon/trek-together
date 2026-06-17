import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";

import { DifficultyBadge } from "@/components/difficulty-badge";
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
  });

  if (!isPending && !session) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>{" "}
          to see your saved routes.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Routes</h1>
        <Button size="sm" render={<Link to="/plan">Plan new</Link>} />
      </div>

      {list.isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}

      {list.data && list.data.items.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          No routes yet.{" "}
          <Link to="/plan" className="text-foreground underline">
            Plan your first
          </Link>
          .
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {list.data?.items.map((r) => (
          <li key={r.id}>
            <Link
              to="/r/$id"
              params={{ id: r.id }}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistance(r.distanceM)}
                  {r.isPublic && " · public"}
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
