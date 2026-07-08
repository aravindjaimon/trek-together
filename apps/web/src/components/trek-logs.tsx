import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@trek-together/ui/components/button";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { Skeleton } from "@trek-together/ui/components/skeleton";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { formatDuration } from "@/lib/format";
import { useOnline } from "@/lib/use-online";
import { client, orpc, queryClient } from "@/utils/orpc";

import { QueryErrorCard } from "./query-error-card";

/** "12 Jul 2026" — compact, locale-stable-ish date for a log row. */
function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${value} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          aria-hidden
          className={n <= value ? "fill-grade-3 text-grade-3" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}

/**
 * Community trek logs for a route (T11.6 / FR-10): aggregate stats line, the
 * log list, and — for signed-in users — a compact form to add a log. Readable
 * anonymously for a public route; the form appears only when signed in.
 */
export function TrekLogs({ routeId, predictedTimeS }: { routeId: string; predictedTimeS: number }) {
  const { data: session } = useSession();
  const online = useOnline();
  const listQuery = useQuery({
    ...orpc.logs.listForRoute.queryOptions({ input: { routeId } }),
    meta: { silentError: true },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [["logs", "listForRoute"], { input: { routeId } }] });

  if (listQuery.isError) {
    return (
      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          Community logs
        </h2>
        <QueryErrorCard
          title={online ? "Couldn’t load logs" : "You’re offline"}
          body={
            online
              ? "Something went wrong reaching the server. Try again in a moment."
              : "Trek logs need a connection. They’ll load once you’re back online."
          }
          onRetry={() => listQuery.refetch()}
        />
      </section>
    );
  }

  const data = listQuery.data;
  const stats = data?.stats;

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          Community logs
        </h2>
        {stats && stats.count > 0 && (
          <span className="tnum text-xs text-muted-foreground">
            {stats.count} log{stats.count === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Stats line — typical actual vs. predicted time + average rating. */}
      {stats && stats.count > 0 && stats.avgActualDurationS != null && (
        <p className="tnum mt-2 text-sm">
          Typically takes{" "}
          <span className="font-semibold">{formatDuration(stats.avgActualDurationS)}</span>{" "}
          <span className="text-muted-foreground">
            vs predicted {formatDuration(predictedTimeS)}
          </span>
          {stats.avgRating != null && (
            <>
              {" · "}
              <span className="inline-flex items-center gap-1 align-middle">
                <Star size={13} aria-hidden className="fill-grade-3 text-grade-3" />
                {stats.avgRating.toFixed(1)}
              </span>
            </>
          )}
        </p>
      )}

      {session && <LogForm routeId={routeId} onCreated={invalidate} />}

      {listQuery.isLoading ? (
        <ul className="mt-4 space-y-2.5">
          {[0, 1].map((i) => (
            <li key={i} className="rounded-md border border-border bg-card p-3.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </li>
          ))}
        </ul>
      ) : data && data.items.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {data.items.map((log) => (
            <li key={log.id} className="rounded-md border border-border bg-card p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-medium">{log.userName}</span>
                <div className="tnum flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Stars value={log.rating} />
                  <span>{formatDuration(log.actualDurationS)}</span>
                  <span>{formatDate(log.completedOn)}</span>
                </div>
              </div>
              {log.notes && (
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{log.notes}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {session ? "No logs yet — be the first to log this trek." : "No logs yet."}
        </p>
      )}
    </section>
  );
}

/** Compact add-a-log form for signed-in users. */
function LogForm({ routeId, onCreated }: { routeId: string; onCreated: () => void }) {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: () =>
      client.logs.create({
        routeId,
        completedOn: date,
        actualDurationS: (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60,
        rating,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Trek logged");
      setDate("");
      setHours("");
      setMinutes("");
      setRating(0);
      setNotes("");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const durationS = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
  const canSubmit = date !== "" && durationS > 0 && rating >= 1 && rating <= 5;

  return (
    <form
      className="mt-4 space-y-3 rounded-md border border-border bg-sidebar p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) create.mutate();
      }}
    >
      <h3 className="text-sm font-semibold tracking-tight">Log this trek</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="log-date">Date completed</Label>
          <Input
            id="log-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="log-hours">Actual time</Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="log-hours"
              type="number"
              min={0}
              max={168}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="h"
              aria-label="Hours"
            />
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="m"
              aria-label="Minutes"
            />
          </div>
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Rating</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Star
                size={20}
                className={n <= rating ? "fill-grade-3 text-grade-3" : "text-muted-foreground/40"}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="log-notes">Notes</Label>
        <textarea
          id="log-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="How was it? Conditions, highlights, warnings…"
          className="w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 dark:bg-input/30"
        />
      </div>

      <Button
        type="submit"
        className="h-10 w-full text-sm"
        disabled={!canSubmit || create.isPending}
      >
        {create.isPending ? "Logging…" : "Log trek"}
      </Button>
    </form>
  );
}
