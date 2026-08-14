# Use-Case Diagram (T9.2)

> Rendered as Mermaid (GitHub-native, version-controlled) in place of drawio/PNG.
> Actors and use cases follow PRD §5.

```mermaid
flowchart LR
    guest([Visitor / Anonymous])
    user([Registered User])
    subgraph Trek Together
      UC1((Plan a route))
      UC2((Analyze route<br/>difficulty + time))
      UC3((View public route<br/>by share link))
      UC4((Explore routes<br/>near a point))
      UC5((Export GPX / JSON))
      UC6((Register / Sign in))
      UC7((Save route))
      UC8((List my routes))
      UC9((Edit / delete<br/>own route))
      UC10((Share route<br/>make public))
    end

    guest --> UC1
    guest --> UC2
    guest --> UC3
    guest --> UC4
    guest --> UC5
    guest --> UC6

    user --> UC1
    user --> UC2
    user --> UC7
    user --> UC8
    user --> UC9
    user --> UC10
    user --> UC4
    user --> UC5

    UC7 -. requires .-> UC2
    UC2 -. uses elevation cache .-> ext[(Elevation API<br/>OpenTopoData)]
```

## Primary flow — plan → analyze → save → share

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web (React/Leaflet)
    participant A as API (oRPC)
    participant S as Services (geo/grade/time)
    participant C as Elevation cache
    participant DB as MongoDB

    U->>W: click map → polyline
    U->>W: Analyze
    W->>A: routes.analyze(path)
    A->>S: analyzeRoute()
    S->>C: getElevations(points)
    C->>DB: findByKeys (hit) / miss→provider→write-through
    C-->>S: elevations
    S-->>A: profile, ascent/descent, Naismith/Tobler, grade
    A-->>W: analysis
    U->>W: Save (name, public?)
    W->>A: routes.create()
    A->>DB: insert route (GeoJSON + embedded profile)
    A-->>W: route id
    W-->>U: /r/:id (shareable)
```
