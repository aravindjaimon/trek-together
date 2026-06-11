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
