# M5 — Share + export

> Make routes shareable by link and exportable as offline GPX/JSON itineraries.

## Why this milestone

This milestone delivers the 'share' half of the product's core loop (plot → analyze → save → share)
and the offline-itinerary requirement (PRD FR-6/FR-8, §5.5). Because all derived values are already
persisted (M4), exports are pure serializers and the share view is a visibility-checked read — small,
high-value, and easy to test.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T5.1](./t5-1-public-share-by-link-view-anonymous-getbyid.md) | Public share-by-link view (anonymous getById) | P1 | 0.5d | T4.5 |
| [T5.2](./t5-2-gpx-export-builder.md) | GPX export builder | P1 | 0.5d | T4.3 |
| [T5.3](./t5-3-json-itinerary-export-builder.md) | JSON itinerary export builder | P1 | 0.5d | T4.3 |
| [T5.4](./t5-4-routesexportitinerary-procedure-gpxjson.md) | routes.exportItinerary procedure (gpx|json) | P1 | 0.5d | T5.2, T5.3 |
| [T5.5](./t5-5-export-anonymous-access-tests.md) | Export + anonymous-access tests | P1 | 0.5d | T5.1, T5.4 |

## Entry criteria (what must be true before starting)

- M4 done: routes persist with full analysis; getById visibility rules in place.

## Exit criteria (milestone is done when…)

- A public route is viewable and exportable by an anonymous user via a stable link.
- GPX and JSON exports are valid, self-contained, and need no network.
- Private exports are owner-only; tests green.

## WOOLF report artifacts produced here

- *Requirement Gathering* (FR-6/FR-8, Viewer actor).
- *Feature Development Process* — export procedure & visibility handling.
