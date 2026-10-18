// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import "./errorLogPanel"; // first, so it catches startup errors too (only with ?debug)
import { attemptPlacement, create, profileOf, queryFit, trayFits, type GameState, type SkinId } from "../core";
import { skinLook } from "../renderer/skins";
import { activeSkin, createSkinPicker, createSkinStats } from "./skins";
import { directFeedback, type CuePlayer } from "../feedback/director";
import { createTextOverlay } from "../feedback/overlay";
import { createComboTag } from "../feedback/comboTag";
import { createSensoryPlayer } from "../feedback/sensoryPlayer";
import { attachDrag } from "../input/drag";
import { cancelsTouch } from "../input/touchGuard";
import { returnAt, type PieceAt } from "../input/returnFlight";
import { createHud, createScoreStats } from "./hud";
import { layoutGame, NO_INSETS, render, trayPieceOrigin, type DragView, type Insets, type ReturnView } from "../renderer/renderer";
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
import { trackViewport } from "./viewport";
import { settingToggles } from "./settingToggles";
import { readDeviceFacts } from "./device";
import { createHomeScreenHint } from "../persistence/homeScreenHint";
import { requestPersistentStorage } from "../persistence/persistentStorage";
import { createHomeScreenHintCard } from "./homeScreenHintCard";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D not supported");

const persistence = createPersistence(localStorageOrNull());
requestPersistentStorage(navigator); // fire and forget: never blocks or breaks play
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
  hintCard.update(homeScreenHint.shown);
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
const device = readDeviceFacts();
// Home Screen Hint (iPhone ticket 07): under "Play again" on the Game Over screen, which keeps focus.
const homeScreenHint = createHomeScreenHint(persistence, device);
const hintCard = createHomeScreenHintCard(gameOver.below, () => {
  homeScreenHint.dismiss();
  gameOver.focusPlayAgain();
});
const settingsSheet = createSettingsSheet(document.body);
// Vibration is offered only where the device can vibrate; its saved setting is kept either way.
for (const toggle of settingToggles(device)) {
  settingsSheet.addToggle(toggle.label, settings[toggle.key], (value) => {
    changeSettings({ [toggle.key]: value });
    if (toggle.key === "sound" && value) audio.unlock(); // the toggle tap is a user gesture
  });
}
// Browsers only start audio from a user gesture: (re)unlock on every touch while sound is on.
// iOS only counts a touch's end as a gesture, so unlock on pointerup/touchend too; capture
// runs it before the drop's Placement, so the first Placement already has its sound.
for (const type of ["pointerdown", "pointerup", "touchend"]) {
  document.addEventListener(
    type,
    () => {
      if (settings.sound) audio.unlock();
    },
    { capture: true },
  );
}

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
/** Praise (with its Combo Pop), NEW BEST! and New Skin pops, drawn over the Board. */
const overlay = createTextOverlay();
/** The Combo Tag beside the score; a resumed Run shows its Combo at once. */
const comboTag = createComboTag();
comboTag.show(state.combo);
/** Clear effects (ticket 10): Line flash, particles, shake, Board Clear flash. */
const effects = createClearEffects();
const players: readonly CuePlayer[] = [
  overlay,
  comboTag,
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
/** Safe-area insets: the layout keeps the Board and Tray clear of them (and of the top band). */
let insets: Insets = NO_INSETS;

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
    insets,
  });
  hud.comboTag(comboTag.frame(now));
}

/** Where the Returning Piece is this frame (it heads for its slot in the current layout). */
function returnView(now: number): ReturnView | null {
  const entry = returning && state.tray[returning.slot];
  if (!returning || !entry) return null;
  returning.start ??= now;
  const layout = layoutGame(cssWidth, cssHeight, state.board.length, insets);
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
// The page follows the visible viewport (Safari's toolbars), and the layout the safe-area insets.
trackViewport((measured) => {
  insets = measured;
  resize();
});
hud.reset(state);
if (state.over) {
  // The restored Run had already ended: show its Game Over screen.
  showGameOver();
}

attachDrag(canvas, {
  getState: () => state,
  getSize: () => ({ width: cssWidth, height: cssHeight, insets }),
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
    if (state.over) {
      homeScreenHint.reachedGameOver(); // only a Run ending now counts, not a resumed one
      showGameOver();
    }
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

// Block browser gestures the CSS can't fully stop on iOS Safari: pinch, double-tap zoom, the long-press callout,
// and (via the touch guard) edge swipe-back, toolbar pull-up and page bounce.
for (const type of ["gesturestart", "dblclick", "contextmenu"] as const) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
for (const phase of ["start", "move"] as const) {
  document.addEventListener(
    `touch${phase}`,
    (e) => {
      // A touch event's target stays the element the touch began on, even as the finger moves away.
      const target = e.target instanceof Element ? e.target : null;
      const cancel = cancelsTouch({
        phase,
        fingers: e.touches.length,
        onPlayArea: target === canvas,
        inScrollable: !!target?.closest(".settings__panel, .game-over__panel"),
      });
      if (cancel && e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
}
