import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the build works under a GitHub Pages sub-path (ticket 02).
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
