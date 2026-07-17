import { useQuery } from "@tanstack/react-query";
import { Input } from "@trek-together/ui/components/input";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import type { LatLng } from "@/components/leaflet-map";
import { orpc } from "@/utils/orpc";

export interface Place {
  label: string;
  lat: number;
  lng: number;
  /** Provider-suggested viewport (SW, NE); null for point-only results. */
  boundingBox: [LatLng, LatLng] | null;
}

const MIN_CHARS = 2;

/**
 * Floating place-search box for the map views (Plan + Explore). Debounced
 * live autocomplete over `places.search`; picking a result calls `onSelect`
 * with the place — the parent decides how to move the map (via `fitTo`). Search
 * only navigates the view; it never mutates the route.
 */
export function MapSearch({
  onSelect,
  className,
}: {
  onSelect: (place: Place) => void;
  className?: string;
}) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  // Debounce keystrokes so we don't hit the (rate-limited) geocoder per letter.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  const query = useQuery({
    ...orpc.places.search.queryOptions({ input: { q: debounced } }),
    enabled: debounced.length >= MIN_CHARS,
    // A geocode failure shows "couldn't search" inline — no global toast (T10.12).
    meta: { silentError: true },
  });

  const results = query.data?.results ?? [];

  function choose(place: Place) {
    onSelect(place);
    setInput("");
    setDebounced("");
    setOpen(false);
  }

  const showPanel = open && debounced.length >= MIN_CHARS;

  return (
    // Closing on blur (unless focus stays within) doubles as click-away: result
    // buttons are focusable, so selecting one keeps focus here and fires first.
    // biome-ignore lint/a11y/noStaticElementInteractions: focus-out listener for click-away, not an interactive control
    <div
      className={className}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              choose(results[0]);
            } else if (e.key === "Escape") {
              setInput("");
              setDebounced("");
              setOpen(false);
              e.currentTarget.blur();
            }
          }}
          placeholder="Search a place…"
          aria-label="Search for a place"
          className="h-10 border-border bg-card/95 pr-9 pl-9 shadow-sm backdrop-blur"
        />
        {query.isFetching && (
          <Loader2
            size={15}
            className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {showPanel && (
        <ul className="mt-1.5 max-h-72 overflow-y-auto rounded-md border border-border bg-card/95 py-1 shadow-md backdrop-blur">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng},${place.label}`}>
              <button
                type="button"
                onClick={() => choose(place)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <Search size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{place.label}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {query.isFetching
                ? "Searching…"
                : query.isError
                  ? "Couldn’t search right now."
                  : "No places found."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
