# 02: Ship to your phone

**What to build:** Make the game an installable, offline-capable PWA that is deployed automatically to GitHub Pages on every push to main. Afterwards, the player can open the link on their Android phone, tap "Add to Home Screen", and launch the game full-screen and offline. New versions are picked up automatically.

**Blocked by:** 01 (Empty Board on screen)

**Status:** ready-for-agent

Note: creating the GitHub repo and logging in needs the human once. Guide them through it (e.g. with a short step-by-step wizard) instead of doing it for them.

- [ ] The web app manifest declares the name, icons, standalone display mode, portrait orientation and theme colors
- [ ] App icons exist at the sizes Android needs (including a maskable icon)
- [ ] The app works with no network after the first load (cached by a service worker via a Vite PWA plugin)
- [ ] A new deploy is picked up on the next launch without reinstalling
- [ ] A GitHub Actions workflow runs the tests, builds, and publishes to GitHub Pages on push to main; failing tests block the deploy
- [ ] The build works under the GitHub Pages sub-path (correct base path)
- [ ] The README documents the one-time setup and how to install on the phone
- [ ] Verified on the player's Android phone: installs to the home screen, opens full-screen, and works in airplane mode
