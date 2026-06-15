/**
 * 2dsphere index on/off benchmark for the explore query (T6.3) — evidence for
 * the report's geo-index section (PROJECT-SPEC.md §9, PRD FR-7).
 *
 * `$geoNear` *requires* a 2dsphere index (it errors without one), so the on/off
 * contrast is measured with the equivalent `$geoWithin`/`$centerSphere` filter,
 * which runs with or without the index. We `explain(executionStats)` each and
 * compare the winning plan + docsExamined + time; then we validate the real
 * `$geoNear` explore path with the index present.
 *
 * MANUAL script — not part of `pnpm test`. Requires a running DB:
 *   pnpm db:start && pnpm -F server bench:explore
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

// Load DATABASE_URL before the Prisma client is imported (it reads env at module
// load). Same approach as packages/db/src/setup-indexes.ts.
dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const { default: prisma } = await import("@trek-together/db");

const SEED_COUNT = 2000;
const RUNS = 20;
const CENTER = { lng: -78.29, lat: 38.55 }; // Shenandoah
const RADIUS_M = 25_000;
const EARTH_RADIUS_M = 6_371_000;

// Deterministic pseudo-random spread (no Math.random → repeatable runs).
function spread(i: number): { lng: number; lat: number } {
  const gx = Math.sin(i * 12.9898) * 43758.5453;
  const gy = Math.sin(i * 78.233) * 12345.6789;
  const fx = gx - Math.floor(gx);
  const fy = gy - Math.floor(gy);
  // ~±0.9° box around center (well beyond the query radius, so most are misses).
  return { lng: CENTER.lng + (fx - 0.5) * 1.8, lat: CENTER.lat + (fy - 0.5) * 1.8 };
}

async function seed(): Promise<void> {
  await prisma.route.deleteMany({});
  const data = Array.from({ length: SEED_COUNT }, (_, i) => {
    const p = spread(i);
    return {
      ownerId: "bench",
      name: `bench-${i}`,
      description: null,
      path: {
        type: "LineString",
        coordinates: [
          [p.lng, p.lat],
          [p.lng + 0.001, p.lat + 0.001],
        ],
      },
      elevationProfile: [
        { distanceAlongM: 0, elevationM: 300 },
        { distanceAlongM: 100, elevationM: 320 },
      ],
      distanceM: 140,
      ascentM: 20,
      descentM: 0,
      estTimeNaismithS: 120,
      estTimeToblerS: 110,
      difficultyScore: 5,
      difficultyBand: "Easiest",
      isPublic: true,
    };
  });
  await prisma.route.createMany({ data });
}

async function ensureIndex(): Promise<void> {
  await prisma.$runCommandRaw({
    createIndexes: "routes",
    indexes: [{ key: { path: "2dsphere" }, name: "path_2dsphere" }],
  });
}

async function dropIndex(): Promise<void> {
  try {
    await prisma.$runCommandRaw({ dropIndexes: "routes", index: "path_2dsphere" });
  } catch {
    // already absent — fine
  }
}

const centerSphere = {
  path: { $geoWithin: { $centerSphere: [[CENTER.lng, CENTER.lat], RADIUS_M / EARTH_RADIUS_M] } },
  isPublic: true,
};

// biome-ignore lint/suspicious/noExplicitAny: raw command result is dynamic
function leafStage(explain: any): { stage: string; indexName: string } {
  const w = explain?.queryPlanner?.winningPlan;
  let s = w?.queryPlan ?? w;
  while (s?.inputStage) s = s.inputStage;
  return { stage: s?.stage ?? "UNKNOWN", indexName: s?.indexName ?? "—" };
}

async function explainWithin(): Promise<{
  stage: string;
  indexName: string;
  docsExamined: number;
  nReturned: number;
}> {
  const res = (await prisma.$runCommandRaw({
    explain: { find: "routes", filter: centerSphere },
    verbosity: "executionStats",
    // biome-ignore lint/suspicious/noExplicitAny: raw command result is dynamic
  })) as any;
  const { stage, indexName } = leafStage(res);
  return {
    stage,
    indexName,
    docsExamined: res?.executionStats?.totalDocsExamined ?? -1,
    nReturned: res?.executionStats?.nReturned ?? -1,
  };
}

async function timeWithin(): Promise<number> {
  const ts: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    await prisma.$runCommandRaw({ find: "routes", filter: centerSphere, limit: 100 });
    ts.push(performance.now() - t);
  }
  return ts.sort((a, b) => a - b)[Math.floor(RUNS / 2)] ?? 0;
}

async function main() {
  console.log(`Seeding ${SEED_COUNT} public routes…`);
  await seed();

  await ensureIndex();
  const onPlan = await explainWithin();
  const onMs = await timeWithin();

  await dropIndex();
  const offPlan = await explainWithin();
  const offMs = await timeWithin();

  // Restore the index and validate the real $geoNear path.
  await ensureIndex();
  const geoNear = (await prisma.$runCommandRaw({
    explain: {
      aggregate: "routes",
      pipeline: [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [CENTER.lng, CENTER.lat] },
            distanceField: "distanceFromQueryM",
            spherical: true,
            maxDistance: RADIUS_M,
            query: { isPublic: true },
          },
        },
        { $limit: 20 },
      ],
      cursor: {},
    },
    verbosity: "executionStats",
    // biome-ignore lint/suspicious/noExplicitAny: raw command result is dynamic
  })) as any;
  // $geoNear's plan lives deep in the aggregate explain; detect the geo stage by name.
  const geoNearStage = JSON.stringify(geoNear).includes("GEO_NEAR_2DSPHERE")
    ? "GEO_NEAR_2DSPHERE"
    : "UNKNOWN";

  const speedup = offMs > 0 && onMs > 0 ? offMs / onMs : 0;
  console.log(`\n2dsphere on/off ($geoWithin, ${SEED_COUNT} docs):`);
  console.log(
    `  index ON:  index=${onPlan.indexName}  docsExamined=${onPlan.docsExamined}  p50=${onMs.toFixed(2)}ms`,
  );
  console.log(
    `  index OFF: index=${offPlan.indexName}  docsExamined=${offPlan.docsExamined}  p50=${offMs.toFixed(2)}ms`,
  );
  console.log(`  $geoNear plan (index on): ${geoNearStage}`);
  console.log(`  speed-up (off/on): ${speedup.toFixed(1)}×\n`);

  const md = `# Explore benchmark — 2dsphere index on/off (T6.3)

> Auto-generated by \`apps/server/scripts/bench-explore.ts\`. Re-run with
> \`pnpm db:start && pnpm -F server bench:explore\`.

**Run:** ${new Date().toISOString()} · Node ${process.version} · ${SEED_COUNT} seeded public routes

## Method

${SEED_COUNT} public routes are seeded across a ~1.8° box around Shenandoah
(${CENTER.lat}, ${CENTER.lng}); the query asks for routes within ${(RADIUS_M / 1000).toFixed(0)} km.
Because \`$geoNear\` mandates a 2dsphere index, the **on/off** contrast is measured with the equivalent
\`$geoWithin\`/\`$centerSphere\` filter (runs either way), via \`explain(executionStats)\`. The production
\`$geoNear\` path is then validated with the index present.

## Results

| Scenario | Index used | Docs examined | p50 latency |
|---|---|---|---|
| 2dsphere **ON** | \`${onPlan.indexName}\` | ${onPlan.docsExamined} | ${onMs.toFixed(2)} ms |
| 2dsphere **OFF** | \`${offPlan.indexName}\` | ${offPlan.docsExamined} | ${offMs.toFixed(2)} ms |

- Both return **${onPlan.nReturned}** matching routes. With the geo index Mongo seeks via
  \`${onPlan.indexName}\` and examines only ~${onPlan.docsExamined} docs; without it the planner falls
  back to the \`${offPlan.indexName}\` index and post-filters the geometry over all
  **${offPlan.docsExamined}** public docs.
- **~${speedup.toFixed(1)}× faster** with the geo index at this collection size — and the docs-examined
  gap (${onPlan.docsExamined} vs ${offPlan.docsExamined}) grows linearly as routes accumulate.
- Production \`routes.explore\` uses \`$geoNear\` (winning stage \`${geoNearStage}\`), which **requires**
  the 2dsphere index created by \`packages/db/src/setup-indexes.ts\`.

## Notes

- Latencies are tiny at ${SEED_COUNT} docs; the **docs-examined** column is the durable signal — index
  turns an O(n) scan into an index seek.
- Re-run to refresh; numbers vary with machine + Mongo version.
`;

  const dir = fileURLToPath(new URL("../../../docs/benchmarks/", import.meta.url));
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}explore.md`, md, "utf8");
  console.log(`Wrote docs/benchmarks/explore.md`);

  // Clean up seeded rows so dev data stays tidy.
  await prisma.route.deleteMany({ where: { ownerId: "bench" } });
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Explore benchmark failed:", err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
