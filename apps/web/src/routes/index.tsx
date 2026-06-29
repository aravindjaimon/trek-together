import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Compass, Route as RouteIcon } from "lucide-react";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const STEPS = [
  { n: "01", title: "Plot", body: "Trace your trail on the map, point by point." },
  { n: "02", title: "Analyze", body: "We sample real elevation along every segment." },
  { n: "03", title: "Grade", body: "Ascent, descent, time, and a Shenandoah difficulty." },
  { n: "04", title: "Share", body: "Save it, send a link, or export GPX for offline." },
] as const;

function HomeComponent() {
  const healthCheck = useQuery({
    ...orpc.healthCheck.queryOptions(),
    // The footer dot is the single signal — no global toast, no retry delay.
    retry: false,
    meta: { silentError: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero */}
      <section className="bg-contour relative overflow-hidden rounded-xl border border-border bg-card px-6 py-14 sm:px-10 sm:py-20">
        <p className="tnum text-xs font-medium tracking-wide text-trail uppercase">Trek Together</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          How hard is this hike, <span className="text-primary">really?</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground text-pretty sm:text-lg">
          Draw a trail on the map and get a trustworthy difficulty grade backed by real elevation —
          total ascent and descent, an estimated walking time, and a Shenandoah grade. The honest
          answer before you commit.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" className="h-11 px-5 text-sm" render={<Link to="/plan" />}>
            <RouteIcon size={16} /> Plan a route
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-5 text-sm"
            render={<Link to="/explore" />}
          >
            <Compass size={16} /> Explore nearby
          </Button>
        </div>
      </section>

      {/* How it works — a real ordered sequence, so the numbering carries meaning. */}
      <section className="mt-12">
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          The whole flow
        </h2>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-2 bg-card p-5">
              <span className="tnum text-sm font-semibold text-trail">{s.n}</span>
              <span className="text-base font-semibold tracking-tight">{s.title}</span>
              <span className="text-sm text-muted-foreground text-pretty">{s.body}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Quiet status footer */}
      <div className="mt-12 mb-8 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`inline-block size-1.5 rounded-full ${
            healthCheck.isLoading
              ? "bg-muted-foreground animate-pulse"
              : healthCheck.data
                ? "bg-grade-1"
                : "bg-grade-5"
          }`}
        />
        <span>
          {healthCheck.isLoading
            ? "Checking service…"
            : healthCheck.data
              ? "All systems operational"
              : "Service unavailable"}
        </span>
      </div>
    </div>
  );
}
