import { beforeEach, describe, expect, it } from "vitest";
import { consumeDailyBudget, resetDailyBudgets } from "./quota";
import { ElevationProviderError } from "./types";

const DAY_MS = 86_400_000;

beforeEach(() => resetDailyBudgets());

describe("consumeDailyBudget", () => {
  it("allows up to the limit, then throws a typed provider error", () => {
    consumeDailyBudget("p", 2);
    consumeDailyBudget("p", 2);

    expect(() => consumeDailyBudget("p", 2)).toThrowError(ElevationProviderError);
  });

  it("tracks providers independently", () => {
    consumeDailyBudget("a", 1);

    expect(() => consumeDailyBudget("a", 1)).toThrowError(ElevationProviderError);
    expect(() => consumeDailyBudget("b", 1)).not.toThrow();
  });

  it("resets on the UTC day boundary", () => {
    const today = 5 * DAY_MS + 1000;
    consumeDailyBudget("p", 1, today);
    expect(() => consumeDailyBudget("p", 1, today)).toThrowError(ElevationProviderError);

    expect(() => consumeDailyBudget("p", 1, today + DAY_MS)).not.toThrow();
  });

  it("does not leak the limit into a user-facing message shape", () => {
    consumeDailyBudget("p", 1);
    const err = (() => {
      try {
        consumeDailyBudget("p", 1);
      } catch (e) {
        return e as ElevationProviderError;
      }
      return undefined;
    })();

    // Typed like every provider failure, so the fallback → degradation path
    // (cache.ts → ElevationUnavailableError) handles it with no special case.
    expect(err).toBeInstanceOf(ElevationProviderError);
    expect(err?.provider).toBe("p");
  });
});
