// Pointer drag: Tray Piece → Board origin. Pointer Events cover touch and mouse.
// Holds no rules: it asks the host (the core) what fits, for the Snap, and to attempt the Placement.
import type { GameState, Position } from "../core";
import { layoutGame, type DragView } from "../renderer/renderer";
import { amplifiedTopLeft, boardPosition, clampOnScreen, liftedTopLeft, pieceSize, type Point } from "./geometry";
import type { PieceAt } from "./returnFlight";
import { snapOrigin, type SnapTuning } from "./snap";

/** How far the dragged Piece's bottom edge floats above the finger, in Board Cells. */
const DRAG_LIFT_CELLS = 1.2;
/** How many times further than the finger a touch Drag carries the Piece. Mouse Drags stay 1:1. */
const DRAG_GAIN = 1.5;
/** Snap: how far, in Cells, the Ghost may reach for a spot that fits, and how much closer a spot must be to win it over. */
const SNAP: SnapTuning = { reach: 1.5, stickiness: 0.25 };

export interface DragHost {
  getState(): GameState;
  /** Canvas size in CSS pixels. */
  getSize(): { width: number; height: number };
  /** Core fit query: does the Piece in `slot` fit at `origin`? */
  fits(slot: number, origin: Position): boolean;
  /** Attempt the Placement; return true if it landed (false → Return). */
  place(slot: number, origin: Position): boolean;
  /** Drag view changed; redraw. */
  changed(drag: DragView | null): void;
  /** The Piece in `slot` didn't land (rejected or cancelled): fly it back from where it was let go. */
  returnToTray(slot: number, from: PieceAt): void;
}

export function attachDrag(canvas: HTMLCanvasElement, host: DragHost): void {
  /** `anchor`: a finger position and where the Piece was drawn then; the Piece moves `gain`× the finger's travel from it. */
  let active: {
    pointerId: number;
    slot: number;
    gain: number;
    anchor: { finger: Point; at: Point } | null;
  } | null = null;
  let drag: DragView | null = null;

  const layout = () => {
    const { width, height } = host.getSize();
    return layoutGame(width, height, host.getState().board.length);
  };
  const point = (e: PointerEvent): Point => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (active) return;
    const p = point(e);
    const slot = layout().traySlots.findIndex(
      (s) => p.x >= s.x && p.x < s.x + s.w && p.y >= s.y && p.y < s.y + s.h,
    );
    if (slot < 0 || !host.getState().tray[slot]) return;
    active = { pointerId: e.pointerId, slot, gain: e.pointerType === "mouse" ? 1 : DRAG_GAIN, anchor: null };
    canvas.setPointerCapture(e.pointerId);
    move(p);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (active?.pointerId === e.pointerId) move(point(e));
  });

  canvas.addEventListener("pointerup", (e) => {
    if (active?.pointerId !== e.pointerId) return;
    const released = drag;
    end();
    // Same origin the Ghost showed (after any Snap), so the drop lands exactly there.
    if (released && !host.place(released.slot, released.origin)) returnToTray(released);
  });

  for (const type of ["pointercancel", "lostpointercapture"] as const) {
    canvas.addEventListener(type, (e) => {
      if (active?.pointerId !== e.pointerId) return;
      const released = drag;
      end();
      if (released) returnToTray(released);
    });
  }

  function returnToTray(released: DragView): void {
    host.returnToTray(released.slot, { x: released.x, y: released.y, cellSize: layout().board.cellSize });
  }

  function move(p: Point): void {
    if (!active) return;
    const entry = host.getState().tray[active.slot];
    if (!entry) return end();
    const { board } = layout();
    const { cellSize } = board;
    const free = active.anchor
      ? amplifiedTopLeft(active.anchor.at, active.anchor.finger, p, active.gain)
      : liftedTopLeft(p, entry.piece, cellSize, cellSize * DRAG_LIFT_CELLS);
    const at = clampOnScreen(free, pieceSize(entry.piece, cellSize), host.getSize());
    // Re-anchor on grab and whenever a screen edge stops the Piece, so moving back moves it at once.
    if (!active.anchor || at.x !== free.x || at.y !== free.y) active.anchor = { finger: p, at };
    const slot = active.slot;
    const origin = snapOrigin(boardPosition(board, at), (o) => host.fits(slot, o), drag?.origin ?? null, SNAP);
    drag = { slot, x: at.x, y: at.y, origin };
    host.changed(drag);
  }

  function end(): void {
    if (!active) return;
    active = null;
    drag = null;
    host.changed(null);
  }
}
