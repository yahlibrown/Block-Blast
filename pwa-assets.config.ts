import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// Generates the PNG app icons (incl. maskable) from public/icon.svg.
// Run `npm run icons` after changing the SVG; the PNGs are committed.
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: "#1b2440" },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: "#1b2440" },
    },
  },
  images: ["public/icon.svg"],
});
