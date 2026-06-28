import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@trek-together/ui/components/sonner";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { orpc } from "@/utils/orpc";

import "../index.css";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Trek Together — how hard is this hike, really?",
      },
      {
        name: "description",
        content:
          "Draw a trail on the map and get a trustworthy difficulty grade backed by real elevation: ascent, descent, estimated time, and a Shenandoah grade.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        {isAuthRoute ? (
          // Auth screens are their own chrome-free surface — no app header.
          <main className="h-svh overflow-y-auto">
            <Outlet />
          </main>
        ) : (
          <div className="grid grid-rows-[auto_1fr] h-svh">
            <Header />
            <main className="min-h-0 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        )}
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
