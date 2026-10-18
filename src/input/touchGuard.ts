// Touch guard: which raw touches have their browser default cancelled, so the game owns every touch on the play area.
// CSS (`touch-action: none`, no-select, no-callout, no-overscroll) does most of it; iOS Safari still swipes back
// from the screen edge, zooms on pinch and bounces unless the touch events themselves are cancelled.
// Cancelling a touch never stops Pointer Events, which the Drag listens to.

export interface Touch {
  phase: "start" | "move";
  /** Fingers on the screen. */
  fingers: number;
  /** The touch began on the canvas (the Board and Tray). */
  onPlayArea: boolean;
  /** The touch is inside a panel that may scroll (the settings sheet, Skin picker, Game Over screen). */
  inScrollable: boolean;
}

/** Whether to `preventDefault()` this touch event. */
export function cancelsTouch(touch: Touch): boolean {
  if (touch.onPlayArea || touch.fingers > 1) return true;
  // Off the play area a lone finger may tap (start) or scroll a panel (move); any other move would scroll the page.
  return touch.phase === "move" && !touch.inScrollable;
}
