// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import { attemptPlacement, create, queryFit, trayFits, type GameState } from "../core";
import { attachDrag } from "../input/drag";
import { createHud, createScoreStats } from "./hud";
import { render, type DragView } from "../renderer/renderer";
import { createGameOverScreen } from "./gameOver";
import { createFrameLoop } from "./loop";
import { createPersistence } from "../persistence/persistence";
import { loadSettings, saveSettings, type Settings } from "../persistence/settings";
import { createAudio } from "../audio/audio";
import { createHaptics } from "../haptics/haptics";
import { sensoryCues } from "../feedback/sensory";
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

const gameOver = createGameOverScreen(document.body, playAgain);
const gameOverStats = createScoreStats(gameOver.stats);

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
// Browsers only start audio from a user gesture: (re)unlock on every touch.
document.addEventListener("pointerdown", () => audio.unlock(), { capture: true });

/** Start a fresh Run: empty Board, new Tray, Best Score carried over. */
function playAgain(): void {
  drag = null;
  gameOver.hide();
  setState(create({ seed: Date.now(), best: state.best }));
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

function draw(): void {
  const preview = drag ? queryFit(state, drag.slot, drag.origin) : null;
  render(ctx!, cssWidth, cssHeight, { state, drag, preview, trayFits: fits });
}

/** All redraws go through this loop; animations register with `loop.animate`. */
const loop = createFrameLoop(draw, (cb) => requestAnimationFrame(cb));

function setState(next: GameState): void {
  state = next;
  fits = trayFits(state);
  hud.update(state);
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
hud.update(state);
if (state.over) {
  // The restored Run had already ended: show its Game Over screen.
  gameOverStats.update(state);
  gameOver.show();
}

attachDrag(canvas, {
  getState: () => state,
  getSize: () => ({ width: cssWidth, height: cssHeight }),
  place(slot, origin) {
    const result = attemptPlacement(state, slot, origin);
    if (!result.ok) return false; // snaps back: the Piece stays in its Tray slot
    setState(result.state);
    // Standalone sound/vibration mapping; ticket 09's feedback director should absorb it.
    const cues = sensoryCues(result.events);
    audio.play(cues.sounds);
    if (cues.vibration) haptics.vibrate(cues.vibration);
    if (result.events.some((e) => e.type === "gameOver")) {
      gameOverStats.update(state);
      gameOver.show();
    }
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
