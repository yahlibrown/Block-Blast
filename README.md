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

## Layout

- `src/core/`: the pure game core (rules, state, events). No DOM, timers, audio or storage. `src/core/index.ts` is its public interface, and the only thing tests and other modules import.
- `src/tuning/`: the single table of balance numbers.
- `src/renderer/`: Canvas 2D drawing.
- `src/shell/`: the entry point, page and screens. It wires everything together.
- Later: `src/input/`, `src/feedback/`, `src/audio/`, `src/haptics/`, `src/persistence/`.
