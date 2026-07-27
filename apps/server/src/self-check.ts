/** Detects a squatter shadowing our port (T10.9 follow-up).
 *
 * On macOS/BSD, an existing socket bound to a specific loopback address
 * (e.g. `[::1]:3000`) can coexist with our wildcard `express` bind on the
 * same port — no EADDRINUSE, no crash. `localhost` traffic then resolves to
 * whichever socket is more specific, which may not be us. `app.listen()`
 * succeeding is therefore not proof we own `http://localhost:PORT`. */

export const INSTANCE_HEADER = "x-instance-id";
export const SELF_CHECK_HEADER = "x-self-check";

const LOOPBACK_ADDRESSES = ["127.0.0.1", "[::1]"];
const PROBE_TIMEOUT_MS = 2000;

/** Loopback addresses on `port` that answer with someone else's instance id.
 * An address that's unreachable (family not bound, timeout) is inconclusive
 * and never reported as shadowed. */
export async function findShadowedAddresses(port: number, instanceId: string): Promise<string[]> {
  const results = await Promise.all(
    LOOPBACK_ADDRESSES.map(async (address) => {
      try {
        const res = await fetch(`http://${address}:${port}/`, {
          headers: { [SELF_CHECK_HEADER]: instanceId },
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        const seenId = res.headers.get(INSTANCE_HEADER);
        return seenId !== null && seenId !== instanceId ? address : null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((address) => address !== null);
}
