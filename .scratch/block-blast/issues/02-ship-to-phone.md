# 02: Ship to your phone

**What to build:** Make the game an installable, offline-capable PWA that is deployed automatically to GitHub Pages on every push to main. Afterwards, the player can open the link on their Android phone, tap "Add to Home Screen", and launch the game full-screen and offline. New versions are picked up automatically.

**Blocked by:** 01 (Empty Board on screen)

**Status:** ready-for-human

Note: creating the GitHub repo and logging in needs the human once. Guide them through it (e.g. with a short step-by-step wizard) instead of doing it for them.

- [x] The web app manifest declares the name, icons, standalone display mode, portrait orientation and theme colors
- [x] App icons exist at the sizes Android needs (including a maskable icon)
- [x] The app works with no network after the first load (cached by a service worker via a Vite PWA plugin)
- [x] A new deploy is picked up on the next launch without reinstalling
- [x] A GitHub Actions workflow runs the tests, builds, and publishes to GitHub Pages on push to main; failing tests block the deploy
- [x] The build works under the GitHub Pages sub-path (correct base path)
- [x] The README documents the one-time setup and how to install on the phone
- [ ] Verified on the player's Android phone: installs to the home screen, opens full-screen, and works in airplane mode

## Comments

Implemented on branch `ticket-02-ship-to-phone`: `vite-plugin-pwa` (autoUpdate, generateSW precaching everything), icons generated from `public/icon.svg`, `.github/workflows/deploy.yml`, base path derived from `actions/configure-pages` in CI (`config/basePath.ts`, relative `./` locally), README section, and the one-time wizard `scripts/setup-github-pages.sh`.

The human must still:
- Run `bash scripts/setup-github-pages.sh` once (create the public repo, set Pages source to GitHub Actions, push `block-blast` as `main`, watch the first deploy).
- Verify on the Android phone: Add to Home Screen, opens full-screen in portrait, works in airplane mode.
- Spot-check updates: after a later push, the new version appears after relaunching (the background update finishes on the first online launch; a second launch shows it).
- Offline and update behaviour were only checked by inspecting the build output (generated `sw.js`, manifest, registration), not on a real device or in CI. The workflow has not run yet.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). Only the human checks above remain (on the Android phone / GitHub setup); set Status to resolved once verified.
