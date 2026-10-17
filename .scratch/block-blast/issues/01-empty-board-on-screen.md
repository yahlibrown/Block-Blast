# 01: Empty Board on screen

**What to build:** Set up the project skeleton: TypeScript + Vite + Vitest, following ADR-0001 (no React, no game engine). Opening the app shows an empty 8×8 Board drawn on a Canvas, sized for a portrait phone screen. The developer can open it in a desktop browser with live reload, and on an Android phone over home Wi-Fi. Separate the pure game core from the Canvas/shell layer from the start, so later tickets slot their rules into the core.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Running the dev script serves the app with live reload on desktop
- [ ] The dev server can be reached from a phone on the same Wi-Fi (exposed on the LAN), and the README says how
- [ ] An empty 8×8 Board is drawn on a Canvas, centered and filling the width of a portrait phone screen, crisp on high-DPI displays
- [ ] The page has no scrolling, no zoom on double-tap, and no pull-to-refresh while playing
- [ ] The test script runs Vitest, with at least one passing test against the game core
- [ ] The game core has no DOM, timer, audio or storage access
- [ ] A short README explains how to run, test and open the game on a phone
