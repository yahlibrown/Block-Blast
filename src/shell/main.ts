// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import { attemptPlacement, create, profileOf, queryFit, trayFits, type GameState, type SkinId } from "../core";
import { skinLook } from "../renderer/skins";
import { activeSkin, createSkinPicker, createSkinStats } from "./skins";
import { directFeedback, type CuePlayer } from "../feedback/director";
import { createTextOverlay } from "../feedback/overlay";
import { createSensoryPlayer } from "../feedback/sensoryPlayer";
import { attachDrag } from "../input/drag";
import { returnAt, type PieceAt } from "../input/returnFlight";
import { createHud, createScoreStats } from "./hud";
import { layoutGame, render, trayPieceOrigin, type DragView, type ReturnView } from "../renderer/renderer";
import { createGameOverScreen } from "./gameOver";
import { createFrameLoop } from "./loop";
import { createBackdropTransition } from "./backdrop";
import { createClearEffects } from "../renderer/effects/clearEffects";
import { effectsOverlay } from "../renderer/effects/drawEffects";
import { createPersistence } from "../persistence/persistence";
import { loadSettings, saveSettings, type Settings } from "../persistence/settings";
import { createAudio } from "../audio/audio";
import { createHaptics } from "../haptics/haptics";
import { createSettingsSheet } from "./settingsSheet";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D not supported");

const persistence = createPersistence(localStorageOrNull());
let state: GameState = persistence.loadRun({ seed: Date.now() }); // resumes the saved Run
let fits = trayFits(state); // recomputed after every Placement
let drag: DragView | null = null;
/** A Piece Returning to its Tray slot (`start` is set on its first frame). */
let returning: { slot: number; from: PieceAt; start: number | null } | null = null;
const hud = createHud(document.body, canvas);

const gameOver = createGameOverScreen(document.body, playAgain);
const gameOverStats = createScoreStats(gameOver.stats);
const skinStats = createSkinStats(gameOver.stats, (chosen) => chooseSkin(chosen));

function showGameOver(): void {
  gameOverStats.update(state);
  skinStats.update(state, shownSkin());
  gameOver.show();
}

// Sound, haptics and their settings (ticket 11).
const audio = createAudio();
const haptics = createHaptics(navigator);
let settings: Settings = loadSettings(persistence);
function applySettings(next: Settings): void {
  settings = next;
  audio.enabled = settings.sound;
  haptics.enabled = settings.haptics;
}
function changeSettings(change: Partial<Settings>): void {
  applySettings({ ...settings, ...change });
  saveSettings(persistence, settings);
}
applySettings(settings);
const settingsSheet = createSettingsSheet(document.body);
settingsSheet.addToggle("Sound", settings.sound, (sound) => {
  changeSettings({ sound });
  if (sound) audio.unlock(); // the toggle tap is a user gesture
});
settingsSheet.addToggle("Vibration", settings.haptics, (haptics) => changeSettings({ haptics }));
// Browsers only start audio from a user gesture: (re)unlock on every touch while sound is on.
document.addEventListener(
  "pointerdown",
  () => {
    if (settings.sound) audio.unlock();
  },
  { capture: true },
);

// Skins (ticket 13): the chosen Skin is a setting; only unlocked Skins can be shown.
const shownSkin = (): SkinId => activeSkin(state.unlocked, settings.skin);
let skin = skinLook(shownSkin());
const skinPicker = createSkinPicker(settingsSheet.content, (chosen) => chooseSkin(chosen));
function chooseSkin(chosen: SkinId): void {
  changeSettings({ skin: chosen });
  refreshSkin();
}
/** Re-derive the Skin on show (after a choice or an unlock) and update everything that shows it. */
function refreshSkin(instant = false): void {
  const id = shownSkin();
  skin = skinLook(id);
  skinPicker.update(state.unlocked, id);
  backdrop.setBase(skin.backdrop, instant);
  loop.invalidate();
}

// Feedback players: each gets every Placement's cues and plays the kinds it handles.
/** Praise, COMBO ×N, NEW BEST! and New Skin pops, drawn over the Board. */
const overlay = createTextOverlay();
/** Clear effects (ticket 10): Line flash, particles, shake, Board Clear flash. */
const effects = createClearEffects();
const players: readonly CuePlayer[] = [
  overlay,
  effects,
  createSensoryPlayer(audio, haptics),
  {
    // A Skin unlocked mid-Run: the picker shows it at once (the banner is the overlay's).
    play(cues) {
      if (cues.some((c) => c.kind === "skinUnlocked")) refreshSkin();
    },
    reset() {},
    busy: () => false,
  },
];

/** Start a fresh Run: empty Board, new Tray; Best Score, Lifetime Points and Skins carried over. */
function playAgain(): void {
  drag = null;
  returning = null;
  gameOver.hide();
  for (const player of players) player.reset(); // no pops, particles or shake carry over
  setState(create({ seed: Date.now(), profile: profileOf(state) }));
  hud.reset(state);
}

let cssWidth = 0;
let cssHeight = 0;

/** Match the backing store to CSS size × devicePixelRatio for crisp high-DPI drawing. */
function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  cssWidth = canvas!.clientWidth;
  cssHeight = canvas!.clientHeight;
  canvas!.width = Math.round(cssWidth * dpr);
  canvas!.height = Math.round(cssHeight * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(); // resizing clears the canvas: redraw now, not next frame
}

let lastNow = 0;

function draw(now: number = lastNow): void {
  lastNow = now;
  const preview = drag?.origin ? queryFit(state, drag.slot, drag.origin) : null;
  const boardOverlay = effectsOverlay(effects.frame(now), state.board, skin);
  render(ctx!, cssWidth, cssHeight, {
    skin,
    state,
    drag,
    returning: returnView(now),
    preview,
    trayFits: fits,
    backdrop: backdrop.current(),
    boardOverlay,
    texts: overlay.frame(now),
  });
}

/** Where the Returning Piece is this frame (it heads for its slot in the current layout). */
function returnView(now: number): ReturnView | null {
  const entry = returning && state.tray[returning.slot];
  if (!returning || !entry) return null;
  returning.start ??= now;
  const layout = layoutGame(cssWidth, cssHeight, state.board.length);
  const home = { ...trayPieceOrigin(layout, returning.slot, entry.piece), cellSize: layout.trayCellSize };
  const at = returnAt(returning.from, home, now - returning.start);
  return at && { slot: returning.slot, ...at };
}

/** All redraws go through this loop; animations register with `loop.animate`. */
const loop = createFrameLoop(draw, (cb) => requestAnimationFrame(cb));

/** Palette Shift colors: blends to the Run's level; the page behind the HUD follows the canvas. */
const backdrop = createBackdropTransition(
  loop,
  (b) => {
    document.body.style.background = b.background;
  },
  skin.backdrop, // Palette Shifts tint the chosen Skin's base colors
);
backdrop.setLevel(state.paletteLevel, true); // a resumed Run opens at its colors, no blend
refreshSkin(true);

function setState(next: GameState): void {
  state = next;
  fits = trayFits(state);
  backdrop.setLevel(state.paletteLevel); // smooth Palette Shift (and back to level 0 on a new Run)
  persistence.saveRun(state); // after every Placement (incl. Game Over) and Play again
  loop.invalidate();
}

/** `localStorage`, or `null` where touching it throws (e.g. storage blocked). */
function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
resize();
hud.reset(state);
if (state.over) {
  // The restored Run had already ended: show its Game Over screen.
  showGameOver();
}

attachDrag(canvas, {
  getState: () => state,
  getSize: () => ({ width: cssWidth, height: cssHeight }),
  fitsAt: (slot, origin) => queryFit(state, slot, origin).fits,
  place(slot, origin) {
    const result = attemptPlacement(state, slot, origin);
    if (!result.ok) return false; // the drag input Returns the Piece to its Tray slot
    setState(result.state);
    // State changes at once; effects only draw on top, so the next Piece can be dragged right away.
    // performance.now() shares the rAF timestamp's time base.
    const now = performance.now();
    const cues = directFeedback(result.events);
    for (const player of players) {
      player.play(cues, now);
      if (player.busy(now)) loop.animate((t) => player.busy(t));
    }
    hud.update(state, now);
    loop.animate((t) => hud.tick(t));
    if (state.over) showGameOver();
    return true;
  },
  changed(next) {
    drag = next;
    if (next && returning?.slot === next.slot) returning = null; // picked up again mid-flight
    loop.invalidate();
  },
  returnToTray(slot, from) {
    const flight = { slot, from, start: null };
    returning = flight;
    loop.animate((t) => {
      if (returning !== flight) return false; // replaced, picked up again, or a new Run
      if (returnView(t)) return true;
      returning = null; // home: the Tray draws it in its slot again
      return false;
    });
  },
});

// Block browser gestures the CSS can't fully stop (iOS-style pinch, double-tap zoom).
for (const type of ["gesturestart", "dblclick"] as const) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
