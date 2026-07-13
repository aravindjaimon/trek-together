import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouterClient } from "@trek-together/api/routers/index";
import { env } from "@trek-together/env/web";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Routes/logs are near-static within a session: treat data as fresh for
        // 60s so navigating back or refocusing the tab reuses the cache instead
        // of refetching on every mount (staleTime defaults to 0). gcTime spans a
        // day so the localStorage-persisted cache (below) still serves offline
        // reloads rather than being evicted after the 5-min default.
        staleTime: 60_000,
        gcTime: 1000 * 60 * 60 * 24,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Queries that render their own failure state opt out of the toast.
        if (query.meta?.silentError) return;
        toast.error(`Error: ${error.message}`, {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
  });
}

export const queryClient = createQueryClient();

// Persists the query cache to localStorage for offline reloads (T8.3).
// Exported so sign-out can purge it — cached private routes must not survive
// on a shared device (T10.13).
export const persister = createSyncStoragePersister({ storage: window.localStorage });

export const link = new RPCLink({
  url: `${env.VITE_SERVER_URL}/rpc`,
  fetch(url, options) {
    // Hard 60s ceiling on every request (composed with any caller signal): a
    // hung provider must surface as an error, not an eternal spinner. 60s
    // because a cold multi-batch analyze can legitimately take ~50s at 1 req/s.
    const init = options as RequestInit;
    const timeout = AbortSignal.timeout(60_000);
    return fetch(url, {
      ...init,
      credentials: "include",
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
