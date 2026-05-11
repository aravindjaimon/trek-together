import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/**/*.{test,spec}.ts", "packages/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/generated/**", "**/.turbo/**"],
  },
});
