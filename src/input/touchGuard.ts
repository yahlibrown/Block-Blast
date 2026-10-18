// Touch guard: which raw touches have their browser default cancelled, so the game owns every touch on the screen.
// CSS (`touch-action: none`, no-select, no-callout, no-overscroll) does most of it; iOS Safari still swipes back
// from the screen edge, zooms on pinch and bounces unless the touch events themselves are cancelled.
// Cancelling a touch never stops Pointer Events, which the Drag listens to. Cancelling a touchstart does stop
// the click that would follow it, so a touch that begins on a control is left alone.

/** The class that marks a panel that may scroll (the settings sheet, Game Over screen); the CSS uses it too. */
export const SCROLLABLE_CLASS = "scrollable";
/** The class that marks a non-button element with its own tap (the settings sheet's dimmed backdrop). */
export const TAPPABLE_CLASS = "tappable";
/** Elements a tap acts on: a touch beginning on one (or inside one) must still click. */
export const CONTROL_SELECTOR = `button, a[href], input, label, select, textarea, .${TAPPABLE_CLASS}`;

/** One touch event, as the guard sees it. */
export interface GuardedTouch {
  phase: "start" | "move";
  /** Fingers on the screen. */
  fingers: number;
  /** The touch began on the canvas (the Board and Tray). */
  onPlayArea: boolean;
  /** The touch began on a control (a button, a toggle, a tappable backdrop). */
  onControl: boolean;
  /** The touch began inside a panel that may scroll. */
  inScrollable: boolean;
}

/** Whether to `preventDefault()` this touch event. */
export function cancelsTouch(touch: GuardedTouch): boolean {
  if (touch.onPlayArea || touch.fingers > 1) return true;
  // A lone finger may scroll a panel; any other move would scroll or bounce the page.
  if (touch.phase === "move") return !touch.inScrollable;
  // A lone finger may tap a control or begin scrolling a panel; anywhere else (the HUD band,
  // a dimmed backdrop) it could only start an edge swipe-back.
  return !touch.onControl && !touch.inScrollable;
}
