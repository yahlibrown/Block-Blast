// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import { attemptPlacement, create, queryFit, trayFits, type GameState } from "../core";
import { directFeedback } from "../feedback/director";
import { createTextOverlay } from "../feedback/overlay";
import { attachDrag } from "../input/drag";
import { createHud, createScoreStats } from "./hud";
import { render, type DragView } from "../renderer/renderer";
import { createGameOverScreen } from "./gameOver";
import { createFrameLoop } from "./loop";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D not supported");

let state: GameState = create({ seed: Date.now() });
let fits = trayFits(state); // recomputed after every Placement
let drag: DragView | null = null;
const hud = createHud(document.body, canvas);
/** Praise, COMBO ×N and NEW BEST! pops, drawn over the Board. */
const overlay = createTextOverlay();

const gameOver = createGameOverScreen(document.body, playAgain);
const gameOverStats = createScoreStats(gameOver.stats);

/** Start a fresh Run: empty Board, new Tray, Best Score carried over. */
function playAgain(): void {
  drag = null;
  gameOver.hide();
  overlay.reset();
  setState(create({ seed: Date.now(), best: state.best }));
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

function draw(now: number = performance.now()): void {
  const preview = drag ? queryFit(state, drag.slot, drag.origin) : null;
  const texts = overlay.frame(now);
  render(ctx!, cssWidth, cssHeight, { state, drag, preview, trayFits: fits, texts });
}

/** All redraws go through this loop; animations register with `loop.animate`. */
const loop = createFrameLoop(draw, (cb) => requestAnimationFrame(cb));

function setState(next: GameState): void {
  state = next;
  fits = trayFits(state);
  loop.invalidate();
}

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
resize();
hud.reset(state);

attachDrag(canvas, {
  getState: () => state,
  getSize: () => ({ width: cssWidth, height: cssHeight }),
  place(slot, origin) {
    const result = attemptPlacement(state, slot, origin);
    if (!result.ok) return false; // snaps back: the Piece stays in its Tray slot
    setState(result.state);
    // performance.now() shares the rAF timestamp's time base.
    const now = performance.now();
    hud.update(state, now);
    loop.animate((t) => hud.tick(t));
    overlay.play(directFeedback(result.events), now);
    if (overlay.busy(now)) loop.animate((t) => overlay.busy(t));
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
