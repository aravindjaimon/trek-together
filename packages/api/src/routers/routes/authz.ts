import type { RouteRecord, RoutesRepo } from "../../data/routes.repo";

/**
 * Ownership gate for mutating procedures (T4.7). Returns the route only when the
 * caller owns it; a missing route and someone else's route are indistinguishable
 * (both `null`), so callers surface a uniform `NOT_FOUND` and never leak that a
 * private route exists.
 */
export async function findOwnedRoute(
  repo: RoutesRepo,
  id: string,
  userId: string,
): Promise<RouteRecord | null> {
  const route = await repo.findById(id);
  return route && route.ownerId === userId ? route : null;
}

/**
 * Read gate for `getById` / export (T4.5, T5.4). A route is visible when it is
 * public (anonymous share-by-link, PRD FR-6) or the caller owns it; otherwise
 * `null`, which callers surface as a uniform `NOT_FOUND`.
 */
export async function findVisibleRoute(
  repo: RoutesRepo,
  id: string,
  userId: string | undefined,
): Promise<RouteRecord | null> {
  const route = await repo.findById(id);
  return route && (route.isPublic || route.ownerId === userId) ? route : null;
}

/**
 * Same visibility rule as {@link findVisibleRoute}, but for gates that only need
 * yes/no and discard the route (`logs.listForRoute` / `logs.create`). Reads a
 * projected `{ ownerId, isPublic }` instead of the full document — no GeoJSON
 * path or elevation profile crosses the wire just to decide access.
 */
export async function isRouteVisible(
  repo: RoutesRepo,
  id: string,
  userId: string | undefined,
): Promise<boolean> {
  const v = await repo.findVisibility(id);
  return !!v && (v.isPublic || v.ownerId === userId);
}
