import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import { resolveBase } from "./config/basePath.ts";

// CI sets PAGES_BASE_PATH from actions/configure-pages (e.g. "/block-blast"),
// so the repo name is never hard-coded. Locally the base stays relative.
const base = resolveBase(process.env.PAGES_BASE_PATH);

const THEME = "#1b2440";

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      // New deploys install in the background and take over on the next launch.
      registerType: "autoUpdate",
      injectRegister: "auto",
      // workbox.globPatterns below already precaches every icon in dist/.
      includeManifestIcons: false,
      manifest: {
        name: "Block Blast",
        short_name: "Block Blast",
        description: "An ad-free block puzzle game.",
        lang: "en",
        display: "standalone",
        orientation: "portrait",
        theme_color: THEME,
        background_color: THEME,
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    include: ["src/**/*.test.ts", "config/**/*.test.ts"],
    environment: "node",
  },
});
