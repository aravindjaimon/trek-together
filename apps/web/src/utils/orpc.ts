import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouterClient } from "@trek-together/api/routers/index";
import { env } from "@trek-together/env/web";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
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
