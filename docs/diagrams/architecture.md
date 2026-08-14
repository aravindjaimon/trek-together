# Architecture Overview (T9.1)

> High-level component + request flow. Monorepo: `apps/web`, `apps/server`, `packages/*`.

```mermaid
flowchart LR
    subgraph web [apps/web · React + TanStack Router + Vite PWA]
      map[Leaflet planner]
      chart[SVG elevation chart]
      rq[React Query<br/>persisted cache]
      sw[Service worker<br/>shell + OSM tiles]
    end

    subgraph server [apps/server · Express 5]
      rpc[/rpc — oRPC handler/]
      auth[/api/auth — Better-Auth/]
      oapi[/api-reference — OpenAPI/]
    end

    subgraph api [packages/api]
      proc[routers/ — thin procedures]
      svc[services/ — geo, grade, time, export]
      data[data/ — repos own Prisma/Mongo]
      integ[integrations/ — elevation cache-first]
    end

    db[(packages/db · Prisma + MongoDB)]
    prov[Elevation providers]

    web -->|typed oRPC client| rpc
    web --> auth
    rpc --> proc
    proc --> svc
    proc --> data
    svc --> integ
    integ --> data
    integ -->|cache miss| prov
    data --> db
    proc -. Zod in/out .- proc
```

## Layering rules (enforced)
- **Procedures** are thin: Zod-validate → call a service → return typed output. No math, no direct DB.
- **Services** are pure and unit-tested: geo math, smoothing, Naismith/Tobler, Shenandoah grading, export.
- **Data layer** owns *all* Prisma / raw-Mongo (`$geoNear` via `aggregateRaw`).
- **Integrations** wrap external elevation providers behind a cache-first service.
- Types flow end-to-end: the web client infers its types from the server's `AppRouter` — no duplication.
