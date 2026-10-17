// Pointer drag: Tray Piece → Board origin. Pointer Events cover touch and mouse.
// Holds no rules: it asks the shell to attempt the Placement on release.
import type { GameState, Position } from "../core";
import { layoutGame, trayPieceOrigin, type DragView } from "../renderer/renderer";

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
  let active: { pointerId: number; slot: number; dx: number; dy: number } | null = null;
  let drag: DragView | null = null;

  const layout = () => {
    const { width, height } = host.getSize();
    return layoutGame(width, height, host.getState().board.length);
  };
  const point = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (active) return;
    const p = point(e);
    const l = layout();
    const slot = l.traySlots.findIndex(
      (s) => p.x >= s.x && p.x < s.x + s.w && p.y >= s.y && p.y < s.y + s.h,
    );
    const entry = host.getState().tray[slot];
    if (slot < 0 || !entry) return;
    // Keep the grabbed point of the Piece under the finger as it grows to Board scale.
    const rest = trayPieceOrigin(l, slot, entry.piece);
    const scale = l.board.cellSize / l.trayCellSize;
    active = {
      pointerId: e.pointerId,
      slot,
      dx: (p.x - rest.x) * scale,
      dy: (p.y - rest.y) * scale,
    };
    canvas.setPointerCapture(e.pointerId);
    move(p);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (active?.pointerId === e.pointerId) move(point(e));
  });

  canvas.addEventListener("pointerup", (e) => {
    if (active?.pointerId !== e.pointerId || !drag) return;
    const { board } = layout();
    const origin = {
      row: Math.round((drag.y - board.y) / board.cellSize),
      col: Math.round((drag.x - board.x) / board.cellSize),
    };
    const slot = active.slot;
    end();
    host.place(slot, origin);
  });

  canvas.addEventListener("pointercancel", (e) => {
    if (active?.pointerId === e.pointerId) end();
  });

  function move(p: { x: number; y: number }): void {
    if (!active) return;
    drag = { slot: active.slot, x: p.x - active.dx, y: p.y - active.dy };
    host.changed(drag);
  }

  function end(): void {
    active = null;
    drag = null;
    host.changed(null);
  }
}
