// Palette Shift transition: eases the drawn background + glow toward the current
// Palette Shift level's colors through the frame loop, and keeps the page
// background (behind the HUD) in step with the canvas.
import { mixBackdrop, shiftedBackdrop, type Backdrop } from "../renderer/palette";
import type { FrameLoop } from "./loop";

/** How long a Palette Shift takes to blend into the new colors, in ms. */
const SHIFT_MS = 1200;

export interface BackdropTransition {
  /** Colors to draw this frame. */
  current(): Backdrop;
  /** Head for this level's palette. Same level as now → no-op. `instant` skips the blend. */
  setLevel(level: number, instant?: boolean): void;
}

export function createBackdropTransition(
  loop: FrameLoop,
  paint: (backdrop: Backdrop) => void,
): BackdropTransition {
  let level = 0;
  let shown = shiftedBackdrop(0);
  let generation = 0;
  paint(shown);

  return {
    current: () => shown,
    setLevel(next, instant = false) {
      if (next === level) return;
      level = next;
      const from = shown;
      const to = shiftedBackdrop(next);
      const id = ++generation;
      if (instant) {
        shown = to;
        paint(shown);
        loop.invalidate();
        return;
      }
      let start: number | null = null;
      loop.animate((now) => {
        if (id !== generation) return false; // a newer shift took over from where this one was
        start ??= now;
        const t = Math.min(1, (now - start) / SHIFT_MS);
        shown = mixBackdrop(from, to, easeInOut(t));
        paint(shown);
        return t < 1;
      });
    },
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
