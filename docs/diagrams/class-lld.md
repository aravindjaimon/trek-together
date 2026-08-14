# Class Diagram / Low-Level Design (T9.3)

> The layered backend (PROJECT-SPEC §3): procedures (thin) → services (pure) → data (owns Prisma/Mongo)
> → integrations (elevation). Rendered as Mermaid.

```mermaid
classDiagram
    direction LR

    class routesRouter {
        +analyze(input) AnalyzeOutput
        +create(input) Route
        +getById(id) Route
        +listMine(page,limit) Page
        +update(id,patch) Route
        +remove(id) id
        +exportItinerary(id,format) Payload
        +explore(lat,lng,radius) Items
    }

    class analyzeRoute {
        <<service>>
        +analyzeRoute(path, client, opts) AnalyzeOutput
    }
    class geo {
        <<service>>
        +haversineM(a,b) number
        +densify(path, spacingM) DensifiedPoint[]
    }
    class grading {
        <<service>>
        +cumulativeGainLoss(profile)
        +naismithSeconds() / toblerSeconds()
        +difficulty(ascent, distance) band
    }
    class geojson {
        <<service>>
        +toLineString(path) GeoJSONLineString
        +fromLineString(line) LatLng[]
    }
    class exportSvc {
        <<service>>
        +toGpx(route) string
        +toItineraryJson(route) ItineraryJson
    }

    class RoutesRepo {
        <<data>>
        +create(input) RouteRecord
        +findById(id) RouteRecord?
        +listByOwner(args) Result
        +exploreNear(args) ExploreItem[]
        +update(id,patch) RouteRecord
        +delete(id) void
    }
    class ElevationCacheRepo {
        <<data>>
        +findByKeys(keys) Map
        +upsertMany(rows) void
    }

    class ElevationService {
        <<integration>>
        +getElevations(points) ~cache-first~
    }
    class OpenTopoData
    class OpenElevation

    routesRouter ..> analyzeRoute : uses
    routesRouter ..> RoutesRepo : uses
    routesRouter ..> exportSvc : uses
    routesRouter ..> geojson : uses
    analyzeRoute ..> geo
    analyzeRoute ..> grading
    analyzeRoute ..> ElevationService
    ElevationService ..> ElevationCacheRepo
    ElevationService ..> OpenTopoData
    ElevationService ..> OpenElevation
    RoutesRepo ..> MongoDB
    ElevationCacheRepo ..> MongoDB
```
