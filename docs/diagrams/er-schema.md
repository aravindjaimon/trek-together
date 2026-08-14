# Collection / Schema Diagram (T9.4)

> MongoDB collections (Prisma models). Geometry is embedded GeoJSON in a `Json` field; the elevation
> profile is embedded; the owner is **referenced** (no FK — Mongo enforces none). See
> [`docs/decisions/data-model.md`](../decisions/data-model.md).

```mermaid
erDiagram
    USER ||--o{ ROUTE : "owns (ownerId ref)"
    USER ||--o{ SESSION : "has"
    USER ||--o{ ACCOUNT : "has"

    ROUTE {
        ObjectId _id PK
        string ownerId "ref User (no FK)"
        string name
        string description "nullable"
        json path "GeoJSON LineString [lng,lat] — 2dsphere idx"
        ProfilePoint[] elevationProfile "embedded"
        float distanceM
        float ascentM
        float descentM
        float estTimeNaismithS
        float estTimeToblerS
        float difficultyScore
        string difficultyBand
        bool isPublic "idx"
        date createdAt
        date updatedAt
    }

    ELEVATIONCACHE {
        ObjectId _id PK
        string key UK "quantised lat,lng+dataset — unique idx"
        float lat
        float lng
        float elevationM "nullable (out-of-bounds)"
        string dataset
        string source
        date fetchedAt "TTL idx (30d)"
    }

    USER {
        string id PK
        string email UK
        string name
        bool emailVerified
        date createdAt
    }
    SESSION { string id PK; string userId FK; date expiresAt }
    ACCOUNT { string id PK; string userId FK; string providerId }
```

## Indexes (created out-of-band by `packages/db/src/setup-indexes.ts`)

| Collection | Index | Purpose |
|---|---|---|
| `routes` | `path` **2dsphere** | `$geoNear` explore (M6) |
| `routes` | `ownerId`, `isPublic`, `difficultyScore` | listMine / visibility / sort |
| `elevationCache` | `key` **unique** | cache-key lookup (dedup) |
| `elevationCache` | `fetchedAt` **TTL 30d** | auto-expire stale samples |
