// The frame loop: one draw per animation frame, only when something changed or is animating.
// Input calls `invalidate()`; animations (Clear particles, shake, Praise…) register with
// `animate(step)` and keep the loop running until their step returns false.

/** Advances an animation to `now` (rAF timestamp, ms). Return false when it has finished. */
export type AnimationStep = (now: number) => boolean;

export interface FrameLoop {
  /** Redraw on the next frame (coalesced). */
  invalidate(): void;
  /** Run `step` before every draw until it returns false; the frame it finishes on is still drawn. */
  animate(step: AnimationStep): void;
}

export function createFrameLoop(
  draw: (now: number) => void,
  requestFrame: (cb: (now: number) => void) => unknown,
): FrameLoop {
  let scheduled = false;
  let animations: AnimationStep[] = [];

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestFrame(frame);
  };

  function frame(now: number): void {
    scheduled = false;
    animations = animations.filter((step) => step(now));
    draw(now);
    if (animations.length > 0) schedule();
  }

  return {
    invalidate: schedule,
    animate(step) {
      animations.push(step);
      schedule();
    },
  };
}
