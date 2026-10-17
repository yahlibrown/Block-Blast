# Block Blast (ad-free clone)

An ad-free, single-player Block Blast Classic clone. TypeScript + Vite + Canvas 2D, no framework or game engine (see `docs/adr/0001-*.md`).

## Run

Requires Node 20+.

```sh
npm install
npm run dev
```

Open the `Local:` URL (http://localhost:5173) in a desktop browser. It reloads live as you edit.

## Test

```sh
npm test          # one run of Vitest
npm run test:watch
```

`npm run build` type-checks everything, checks that the game core uses no DOM, timer, audio or storage APIs, and builds into `dist/`.

## Open on your phone (same Wi-Fi)

1. Run `npm run dev` on the computer. Vite prints a `Network:` URL, e.g. `http://192.168.1.23:5173/`.
2. Connect the phone to the same Wi-Fi network and open that URL in Chrome.
3. If it doesn't load, allow Node.js through the computer's firewall on private networks (Windows asks the first time; otherwise check Windows Defender Firewall → Allowed apps). Some guest or office networks block devices from talking to each other.

## Install on your phone (GitHub Pages)

The game is an installable, offline-capable web app (PWA). Every push to `main` runs the tests, builds, and publishes it to GitHub Pages via `.github/workflows/deploy.yml`. If a test fails, nothing is deployed.

### One-time setup

Run the setup wizard from a terminal (Git Bash on Windows) in the repo folder:

```sh
bash scripts/setup-github-pages.sh
```

It walks you through each step and tells you what to click:

1. Create an empty **public** repo at https://github.com/new (no README, .gitignore or license).
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push the code: `git remote add origin https://github.com/<you>/<repo>.git`, then `git push -u origin block-blast:main`.
4. Wait for the **Deploy to GitHub Pages** run in the **Actions** tab to go green. If it failed because Pages wasn't enabled yet, finish step 2 and click **Run workflow**.

The game is then at `https://<you>.github.io/<repo>/`. The repo name isn't hard-coded anywhere: the workflow reads the Pages path from `actions/configure-pages` and passes it to Vite as `PAGES_BASE_PATH`. Local builds use a relative base.

### Install on Android

1. Open `https://<you>.github.io/<repo>/` in Chrome on the phone and wait for the board to appear. This first visit caches the game for offline play.
2. Tap **⋮ → Add to Home screen** (or **Install app**).
3. Launch it from the home screen icon. It opens full-screen in portrait and works in airplane mode.

**Updates:** after a new deploy, the next launch with a connection downloads the new version in the background and switches to it. If you still see the old version, close the app and open it again. You never need to reinstall.

### Icons

The app icons in `public/` are generated from `public/icon.svg`. After editing the SVG, run `npm run icons` and commit the PNGs.

## Layout

- `src/core/`: the pure game core (rules, state, events). No DOM, timers, audio or storage. `src/core/index.ts` is its public interface, and the only thing tests and other modules import.
- `src/tuning/`: the single table of balance numbers, read by the core.
- `src/input/`: pointer drag from the Tray to the Board, and the snap-back of a Piece that doesn't fit.
- `src/feedback/`: the feedback director (core events → cues: Praise, Combo, NEW BEST!, Clear effects, sounds, vibration) and the players for its text and sensory cues.
- `src/renderer/`: Canvas 2D drawing, Skin looks, Palette Shift colors, and the Clear effects player (`effects/`).
- `src/audio/`: generated Web Audio sounds.
- `src/haptics/`: the Vibration API wrapper.
- `src/persistence/`: localStorage save and resume, profile and settings.
- `src/shell/`: the entry point, page and screens (HUD, Game Over, settings, Skin picker), and the frame loop. It wires everything together.
- `src/testing/`: shared helpers for core tests (they use only the core's public interface).
- `config/`: build-time helpers for `vite.config.ts` (e.g. the GitHub Pages base path).
- `public/`: app icons and other files served as-is.
- `scripts/setup-github-pages.sh`: the one-time GitHub setup wizard.
