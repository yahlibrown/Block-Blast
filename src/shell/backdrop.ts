// Palette Shift transition: eases the drawn background + glow toward the current
// Palette Shift level's colors through the frame loop, and keeps the page
// background (behind the HUD) in step with the canvas. The chosen Skin gives the
// base Backdrop; Palette Shifts tint it (`shiftedBackdrop(level, base)`).
import { BASE_BACKDROP, mixBackdrop, shiftedBackdrop, type Backdrop } from "../renderer/palette";
import type { FrameLoop } from "./loop";

/** How long a Palette Shift (or a Skin change) takes to blend into the new colors, in ms. */
const SHIFT_MS = 1200;

export interface BackdropTransition {
  /** Colors to draw this frame. */
  current(): Backdrop;
  /** Head for this level's palette. Same level as now → no-op. `instant` skips the blend. */
  setLevel(level: number, instant?: boolean): void;
  /** Change the Skin's base Backdrop (the level stays). `instant` skips the blend. */
  setBase(base: Backdrop, instant?: boolean): void;
}

export function createBackdropTransition(
  loop: FrameLoop,
  paint: (backdrop: Backdrop) => void,
  initialBase: Backdrop = BASE_BACKDROP,
): BackdropTransition {
  let level = 0;
  let base = initialBase;
  let shown = shiftedBackdrop(0, base);
  let generation = 0;
  paint(shown);

  function blendTo(to: Backdrop, instant: boolean): void {
    const from = shown;
    const id = ++generation;
    if (instant) {
      shown = to;
      paint(shown);
      loop.invalidate();
      return;
    }
    let start: number | null = null;
    loop.animate((now) => {
      if (id !== generation) return false; // a newer blend took over from where this one was
      start ??= now;
      const t = Math.min(1, (now - start) / SHIFT_MS);
      shown = mixBackdrop(from, to, easeInOut(t));
      paint(shown);
      return t < 1;
    });
  }

  return {
    current: () => shown,
    setLevel(next, instant = false) {
      if (next === level) return;
      level = next;
      blendTo(shiftedBackdrop(level, base), instant);
    },
    setBase(next, instant = false) {
      if (next === base) return;
      base = next;
      blendTo(shiftedBackdrop(level, base), instant);
    },
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
