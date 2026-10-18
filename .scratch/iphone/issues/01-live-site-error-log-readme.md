# 01: Live site up to date, iPhone error log, "Play on iPhone" README

**What to build:** Bring the GitHub Pages site up to date so every friend gets the latest version, and give the developer, who has no Mac, a way to see errors that only happen on an iPhone.
- **Live site:** push the pending local commits to `main`, and confirm the deploy run goes green.
- **Error log:** an opt-in on-screen error log, switched on by a URL flag (e.g. `?debug`). It lists uncaught errors and unhandled promise rejections over the game. Players without the flag never see it.
- **README:** a short, paste-ready "Play on iPhone" section: open the link in Safari and play, then optionally Share → Add to Home Screen to play offline and keep your Best Score. Update Android-only wording where it now applies to both phones.
- **Home Screen icon and title:** check that the Apple touch icon and the Home Screen app title resolve correctly under the GitHub Pages base path, and that the status-bar style suits the dark theme.

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The live site matches local `main`, and the deploy run is green
- [x] With the debug flag, a thrown error and an unhandled rejection both show up on screen; without it, nothing is shown
- [x] The README has a "Play on iPhone" section that can be pasted into a text message as-is
- [ ] The Apple touch icon loads from the deployed site, and Add to Home Screen shows the right icon and the name "Block Blast"
- [ ] Checked on the iPhone: the live site loads in Safari and the debug flag shows the log

## Comments

- Agent (iphone-01): Added the error log: `src/debug/errorLog.ts` (tested in Node), with its on-screen panel in `src/shell/errorLogPanel.ts`, which main.ts imports first so it also catches startup errors. With `?debug`, uncaught errors and unhandled rejections show in a red panel at the bottom that never blocks input. Without the flag nothing listens. README: a paste-ready "Play on iPhone" section with the real link (https://yahlibrown.github.io/Block-Blast/), an "Install on iPhone" section, a `?debug` note, and Safari added to the Wi-Fi steps. index.html: `apple-mobile-web-app-title` "Block Blast", `mobile-web-app-capable`, and status bar `black-translucent` (the HUD and gear already pad `safe-area-inset-top`). A build with `PAGES_BASE_PATH=/block-blast` resolves the Apple touch icon to `/block-blast/apple-touch-icon-180x180.png`, and the file is in `dist/`. The icon criterion stays open until it's checked on the deployed site and the phone. Not done: pushing to `main` and the deploy (left to the developer), and the iPhone checks.
