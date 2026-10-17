// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import {
  attemptPlacement,
  create,
  profileOf,
  queryFit,
  SKINS,
  trayFits,
  type GameState,
  type SkinId,
} from "../core";
import { skinLook } from "../renderer/skins";
import { createSkinPicker, createSkinStats } from "./skins";
import { directFeedback, type FeedbackCue } from "../feedback/director";
import { createTextOverlay } from "../feedback/overlay";
import { attachDrag } from "../input/drag";
import { createHud, createScoreStats } from "./hud";
import { render, type DragView } from "../renderer/renderer";
import { createGameOverScreen } from "./gameOver";
import { createFrameLoop } from "./loop";
import { createBackdropTransition } from "./backdrop";
import { createClearEffects } from "../renderer/effects/clearEffects";
import { effectsOverlay } from "../renderer/effects/drawEffects";
import { createPersistence } from "../persistence/persistence";
import { loadSettings, saveSettings, type Settings } from "../persistence/settings";
import { createAudio, type Sound } from "../audio/audio";
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
const hud = createHud(document.body, canvas);
/** Praise, COMBO ×N and NEW BEST! pops, drawn over the Board. */
const overlay = createTextOverlay();

const gameOver = createGameOverScreen(document.body, playAgain);
const gameOverStats = createScoreStats(gameOver.stats);
const skinStats = createSkinStats(gameOver.stats, (skin) => chooseSkin(skin));

function showGameOver(): void {
  gameOverStats.update(state);
  skinStats.update(state, activeSkin());
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

// Skins (ticket 13): the chosen Skin is a setting; only unlocked Skins can be shown.
/** The Skin to draw: the chosen one if unlocked, else the first. */
function activeSkin(): SkinId {
  return state.unlocked.includes(settings.skin) ? settings.skin : SKINS[0]!.id;
}
const skinPicker = createSkinPicker(settingsSheet.content, (skin) => chooseSkin(skin));
function chooseSkin(skin: SkinId): void {
  changeSettings({ skin });
  skinPicker.update(state.unlocked, activeSkin());
  backdrop.setBase(skinLook(activeSkin()).backdrop);
  loop.invalidate();
}
skinPicker.update(state.unlocked, activeSkin());
// Browsers only start audio from a user gesture: (re)unlock on every touch.
document.addEventListener("pointerdown", () => audio.unlock(), { capture: true });

/** The director's sound and haptic cues go to `audio` / `haptics` (they check the settings). */
function playSensoryCues(cues: readonly FeedbackCue[]): void {
  const sounds: Sound[] = [];
  for (const cue of cues) {
    if (cue.kind === "sound") sounds.push(cue.sound);
    else if (cue.kind === "haptic") haptics.vibrate(cue.pattern);
  }
  audio.play(sounds);
}

/** Start a fresh Run: empty Board, new Tray; Best Score, Lifetime Points and Skins carried over. */
function playAgain(): void {
  drag = null;
  gameOver.hide();
  overlay.reset();
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

// Clear effects (ticket 10). TODO(review): fold into ticket 09's feedback director if it grows one.
const effects = createClearEffects();
let lastNow = 0;

function draw(now: number = lastNow): void {
  lastNow = now;
  const preview = drag ? queryFit(state, drag.slot, drag.origin) : null;
  const skin = skinLook(activeSkin());
  const boardOverlay = effectsOverlay(effects.frame(now), state.board, skin);
  render(ctx!, cssWidth, cssHeight, {
    skin,
    state,
    drag,
    preview,
    trayFits: fits,
    backdrop: backdrop.current(),
    boardOverlay,
    texts: overlay.frame(now),
  });
}

/** All redraws go through this loop; animations register with `loop.animate`. */
const loop = createFrameLoop(draw, (cb) => requestAnimationFrame(cb));

/** Palette Shift colors: blends to the Run's level; the page behind the HUD follows the canvas. */
const backdrop = createBackdropTransition(
  loop,
  (b) => {
    document.body.style.background = b.background;
  },
  skinLook(activeSkin()).backdrop, // Palette Shifts tint the chosen Skin's base colors
);
backdrop.setLevel(state.paletteLevel, true); // a resumed Run opens at its colors, no blend

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
  place(slot, origin) {
    const result = attemptPlacement(state, slot, origin);
    if (!result.ok) return false; // snaps back: the Piece stays in its Tray slot
    setState(result.state);
    // State changes at once; effects only draw on top, so the next Piece can be dragged right away.
    // performance.now() shares the rAF timestamp's time base.
    const now = performance.now();
    const cues = directFeedback(result.events);
    playSensoryCues(cues);
    effects.onPlacement(result.events, now);
    loop.animate((t) => effects.active(t));
    hud.update(state, now);
    loop.animate((t) => hud.tick(t));
    overlay.play(cues, now);
    if (overlay.busy(now)) loop.animate((t) => overlay.busy(t));
    if (result.events.some((e) => e.type === "skinUnlocked")) {
      skinPicker.update(state.unlocked, activeSkin()); // the "New Skin unlocked!" banner is in `cues`
    }
    if (result.events.some((e) => e.type === "gameOver")) showGameOver();
    return true;
  },
  changed(next) {
    drag = next;
    loop.invalidate();
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
