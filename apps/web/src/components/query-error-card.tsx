import { Button } from "@trek-together/ui/components/button";

/**
 * Inline failure card for list pages — a failed query must never render as an
 * empty state (T10.12). Pair with `meta: { silentError: true }` on the query
 * so the global toast doesn't double-signal.
 */
export function QueryErrorCard(props: { title: string; body: string; onRetry: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center">
      <h2 className="text-sm font-semibold tracking-tight">{props.title}</h2>
      <p className="text-sm text-muted-foreground text-pretty">{props.body}</p>
      <Button size="sm" variant="outline" onClick={props.onRetry}>
        Try again
      </Button>
    </div>
  );
}
