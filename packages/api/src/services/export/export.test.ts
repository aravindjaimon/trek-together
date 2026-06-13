import { describe, expect, it } from "vitest";

import type { RouteRecord } from "../../data/routes.repo";
import { toGpx } from "./gpx";
import { ITINERARY_SCHEMA_VERSION, toItineraryJson } from "./json";

const route: RouteRecord = {
  id: "0".repeat(24),
  ownerId: "u1",
  name: "Old Rag & Ridge",
  description: "A <steep> loop",
  path: {
    type: "LineString",
    coordinates: [
      [-78.3, 38.5],
      [-78.31, 38.55],
    ],
  },
  elevationProfile: [
    { distanceAlongM: 0, elevationM: 300 },
    { distanceAlongM: 2500, elevationM: 700 },
    { distanceAlongM: 5000, elevationM: 500 },
  ],
  distanceM: 5000,
  ascentM: 400,
  descentM: 200,
  estTimeNaismithS: 5400,
  estTimeToblerS: 5100,
  difficultyScore: 28,
  difficultyBand: "Strenuous",
  isPublic: true,
  createdAt: new Date("2026-07-01T00:00:00Z"),
  updatedAt: new Date("2026-07-02T00:00:00Z"),
};

describe("toGpx", () => {
  it("emits a GPX 1.1 track with one elevation-bearing trkpt per profile sample", () => {
    const gpx = toGpx(route);

    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain("http://www.topografix.com/GPX/1/1");
    expect(gpx).toContain("<trkseg>");

    // One trkpt per profile sample, each with an <ele>.
    const trkpts = gpx.match(/<trkpt /g) ?? [];
    expect(trkpts).toHaveLength(route.elevationProfile.length);
    expect(gpx).toContain("<ele>300</ele>");
    expect(gpx).toContain("<ele>700</ele>");

    // The start sample (distance 0) interpolates exactly to the first vertex.
    expect(gpx).toContain('lat="38.5" lon="-78.3"');
  });

  it("XML-escapes name and description", () => {
    const gpx = toGpx(route);
    expect(gpx).toContain("Old Rag &amp; Ridge");
    expect(gpx).toContain("A &lt;steep&gt; loop");
    expect(gpx).not.toContain("<steep>");
  });
});

describe("toItineraryJson", () => {
  it("captures geometry + all derived fields and a version tag", () => {
    const it_ = toItineraryJson(route);

    expect(it_.version).toBe(ITINERARY_SCHEMA_VERSION);
    expect(it_.path).toEqual(route.path);
    expect(it_.elevationProfile).toHaveLength(3);
    expect(it_.distanceM).toBe(5000);
    expect(it_.difficultyBand).toBe("Strenuous");
    // Portable data — no account-scoped fields.
    expect(it_).not.toHaveProperty("ownerId");
    expect(it_).not.toHaveProperty("id");
  });
});
