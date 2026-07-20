import { ArrowDownRight, ArrowUpRight, Clock, Route as RouteIcon } from "lucide-react";

import { formatDistance, formatDuration, formatElevation } from "@/lib/format";

interface Metrics {
  distanceM: number;
  ascentM: number;
  descentM: number;
  estTimeNaismithS: number;
  estTimeToblerS: number;
}

function Stat({
  icon,
  label,
  value,
  tint,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint?: string;
  index: number;
}) {
  return (
    <div
      className="animate-reveal-up flex flex-col gap-1.5 p-3.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={tint ?? "text-muted-foreground"}>{icon}</span>
        {label}
      </div>
      <div className="tnum text-xl leading-none font-semibold text-foreground">{value}</div>
    </div>
  );
}

/** Distance / ascent / descent / time — an instrument cluster for one route (T7.5). */
export function RouteSummary({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:grid-cols-4 sm:divide-y-0">
      <Stat
        index={0}
        icon={<RouteIcon size={15} />}
        label="Distance"
        value={formatDistance(metrics.distanceM)}
      />
      <Stat
        index={1}
        icon={<ArrowUpRight size={15} />}
        label="Ascent"
        value={formatElevation(metrics.ascentM)}
        tint="text-trail"
      />
      <Stat
        index={2}
        icon={<ArrowDownRight size={15} />}
        label="Descent"
        value={formatElevation(metrics.descentM)}
        tint="text-primary"
      />
      <Stat
        index={3}
        icon={<Clock size={15} />}
        label="Est. time"
        value={formatDuration(metrics.estTimeNaismithS)}
      />
    </div>
  );
}
