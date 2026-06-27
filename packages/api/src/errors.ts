import { z } from "zod";

/**
 * Central oRPC typed-error catalogue (T3.4). Attached to the base builder in
 * `index.ts` via `.errors(...)`, so every procedure surfaces one consistent
 * envelope and the client infers the same error union everywhere.
 *
 * Messages are deliberately user-safe — no stack traces, no upstream/internal
 * detail (PROJECT-SPEC.md §7/§11). Zod input-validation failures are already
 * surfaced by oRPC as a structured `BAD_REQUEST`, so they need no entry here.
 */
export const errorCatalogue = {
  /** Request failed a domain/business rule that Zod could not express. */
  VALIDATION: {
    message: "The request was invalid.",
  },
  NOT_FOUND: {
    message: "The requested resource was not found.",
  },
  UNAUTHORIZED: {
    message: "Authentication is required.",
  },
  /** All elevation providers failed for the uncached points (see T1.6). */
  ELEVATION_UNAVAILABLE: {
    message: "Elevation data is temporarily unavailable.",
    data: z.object({ unresolvedCount: z.number().int().nonnegative() }),
  },
  /** Trail snapping failed or is unconfigured — the client falls back to a straight line. */
  ROUTING_UNAVAILABLE: {
    message: "Trail routing is temporarily unavailable.",
  },
  INTERNAL: {
    message: "An unexpected error occurred.",
  },
};
