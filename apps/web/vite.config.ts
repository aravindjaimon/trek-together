import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Trek Together",
        short_name: "Trek Together",
        description:
          "Plan trek routes, grade their difficulty, and log your hikes — offline-ready.",
        theme_color: "#141a17",
        background_color: "#141a17",
        display: "standalone",
        start_url: "/",
        scope: "/",
      },
      pwaAssets: { disabled: false, config: true },
      workbox: {
        // App shell (HTML/JS/CSS) is precached automatically (T8.2). Runtime
        // caching below covers OSM tiles so a previously viewed map works
        // offline, bounded to respect the OSM tile-usage policy (T8.3).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("tile.openstreetmap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
});
