// Shell: wires the core to the Canvas. Owns the DOM and the frame loop.
import { create } from "../core";
import { render } from "../renderer/renderer";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Missing #game canvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D not supported");

const state = create({ seed: Date.now() });

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
  draw();
}

function draw(): void {
  render(ctx!, cssWidth, cssHeight, state.board);
}

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
resize();

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
