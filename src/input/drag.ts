// Pointer drag: Tray Piece → Board origin. Pointer Events cover touch and mouse.
// Holds no rules: the shell asks the core whether the origin fits and attempts the Placement.
import type { GameState, Position } from "../core";
import { layoutGame, type DragView } from "../renderer/renderer";
import { boardOrigin, liftedTopLeft, type Point } from "./geometry";

/** How far the dragged Piece's bottom edge floats above the finger, in Board Cells. */
const DRAG_LIFT_CELLS = 1.2;

export interface DragHost {
  getState(): GameState;
  /** Canvas size in CSS pixels. */
  getSize(): { width: number; height: number };
  /** Attempt the Placement; return true if it landed (false → snap back). */
  place(slot: number, origin: Position): boolean;
  /** Drag view changed; redraw. */
  changed(drag: DragView | null): void;
}

export function attachDrag(canvas: HTMLCanvasElement, host: DragHost): void {
  let active: { pointerId: number; slot: number } | null = null;
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
    active = { pointerId: e.pointerId, slot };
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
    // Same origin the ghost preview showed, so the drop lands exactly there.
    if (released) host.place(released.slot, released.origin);
  });

  for (const type of ["pointercancel", "lostpointercapture"] as const) {
    canvas.addEventListener(type, (e) => {
      if (active?.pointerId === e.pointerId) end();
    });
  }

  function move(p: Point): void {
    if (!active) return;
    const entry = host.getState().tray[active.slot];
    if (!entry) return end();
    const { board } = layout();
    const at = liftedTopLeft(p, entry.piece, board.cellSize, board.cellSize * DRAG_LIFT_CELLS);
    drag = { slot: active.slot, x: at.x, y: at.y, origin: boardOrigin(board, at) };
    host.changed(drag);
  }

  function end(): void {
    if (!active) return;
    active = null;
    drag = null;
    host.changed(null);
  }
}
