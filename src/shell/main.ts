// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import { attemptPlacement, create, queryFit, trayFits, type GameState } from "../core";
import { attachDrag } from "../input/drag";
import { createHud, createScoreStats } from "./hud";
import { render, type DragView } from "../renderer/renderer";
import { createGameOverScreen } from "./gameOver";
import { createFrameLoop } from "./loop";
import { createBackdropTransition } from "./backdrop";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D not supported");

let state: GameState = create({ seed: Date.now() });
let fits = trayFits(state); // recomputed after every Placement
let drag: DragView | null = null;
const hud = createHud(document.body, canvas);

const gameOver = createGameOverScreen(document.body, playAgain);
const gameOverStats = createScoreStats(gameOver.stats);

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
  render(ctx!, cssWidth, cssHeight, {
    state,
    drag,
    preview,
    trayFits: fits,
    backdrop: backdrop.current(),
  });
}

/** All redraws go through this loop; animations register with `loop.animate`. */
const loop = createFrameLoop(draw, (cb) => requestAnimationFrame(cb));

/** Palette Shift colors: blends to the Run's level; the page behind the HUD follows the canvas. */
const backdrop = createBackdropTransition(loop, (b) => {
  document.body.style.background = b.background;
});
backdrop.setLevel(state.paletteLevel, true);

function setState(next: GameState): void {
  state = next;
  fits = trayFits(state);
  hud.update(state);
  backdrop.setLevel(state.paletteLevel); // smooth Palette Shift (and back to level 0 on a new Run)
  loop.invalidate();
}

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
resize();
hud.update(state);

attachDrag(canvas, {
  getState: () => state,
  getSize: () => ({ width: cssWidth, height: cssHeight }),
  place(slot, origin) {
    const result = attemptPlacement(state, slot, origin);
    if (!result.ok) return false; // snaps back: the Piece stays in its Tray slot
    setState(result.state);
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
