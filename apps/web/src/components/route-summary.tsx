import { ArrowDownRight, ArrowUpRight, Clock, Route as RouteIcon } from "lucide-react";

import { formatDistance, formatDuration, formatElevation } from "@/lib/format";

interface Metrics {
  distanceM: number;
  ascentM: number;
  descentM: number;
  estTimeNaismithS: number;
  estTimeToblerS: number;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium tabular-nums">{value}</div>
      </div>
    </div>
  );
}

/** Distance / ascent / descent / time summary for an analysis or saved route (T7.5). */
export function RouteSummary({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat
        icon={<RouteIcon size={18} />}
        label="Distance"
        value={formatDistance(metrics.distanceM)}
      />
      <Stat
        icon={<ArrowUpRight size={18} />}
        label="Ascent"
        value={formatElevation(metrics.ascentM)}
      />
      <Stat
        icon={<ArrowDownRight size={18} />}
        label="Descent"
        value={formatElevation(metrics.descentM)}
      />
      <Stat
        icon={<Clock size={18} />}
        label="Est. time"
        value={formatDuration(metrics.estTimeNaismithS)}
      />
    </div>
  );
}
