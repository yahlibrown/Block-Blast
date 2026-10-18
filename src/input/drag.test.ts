import { describe, expect, it, vi } from "vitest";
import { attachDrag, type DragHost } from "./drag";
import { layoutGame } from "../renderer/renderer";
import { run } from "../testing/core";

const SIZE = { width: 400, height: 700 };

/** Just enough of a canvas for the Drag: events, a box at the page's top-left, pointer capture. */
class FakeCanvas extends EventTarget {
  getBoundingClientRect() {
    return { left: 0, top: 0 };
  }
  setPointerCapture() {}
  releasePointerCapture() {}
}

function pointer(canvas: FakeCanvas, type: string, x: number, y: number, pointerId = 1): void {
  // A mouse carries the Piece 1:1, so it lands right under the finger's path.
  canvas.dispatchEvent(Object.assign(new Event(type), { pointerId, pointerType: "mouse", clientX: x, clientY: y }));
}

function setup() {
  const canvas = new FakeCanvas();
  const state = run({});
  const host = {
    getState: () => state,
    getSize: () => SIZE,
    fitsAt: () => true,
    place: vi.fn<DragHost["place"]>(() => true),
    changed: vi.fn<DragHost["changed"]>(),
    returnToTray: vi.fn<DragHost["returnToTray"]>(),
  };
  const drag = attachDrag(canvas as unknown as HTMLCanvasElement, host);
  const layout = layoutGame(SIZE.width, SIZE.height, 8);
  const slot = layout.traySlots[0]!;
  const grab = { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 };
  const overBoard = { x: SIZE.width / 2, y: layout.board.y + layout.board.cellSize * 4 };
  /** Pick up the first Tray Piece and carry it over the Board, where it would fit. */
  const dragOverBoard = () => {
    pointer(canvas, "pointerdown", grab.x, grab.y);
    pointer(canvas, "pointermove", overBoard.x, overBoard.y);
  };
  return { canvas, host, drag, dragOverBoard, overBoard };
}

describe("cancelling a Drag", () => {
  it("Returns the dragged Piece to its Tray slot and never places it, even when the finger lifts", () => {
    const { canvas, host, drag, dragOverBoard, overBoard } = setup();
    dragOverBoard();
    expect(host.changed).toHaveBeenLastCalledWith(expect.objectContaining({ slot: 0, origin: expect.anything() }));

    drag.cancel();
    pointer(canvas, "pointermove", overBoard.x, overBoard.y + 10);
    pointer(canvas, "pointerup", overBoard.x, overBoard.y + 10);

    expect(host.returnToTray).toHaveBeenCalledTimes(1);
    expect(host.returnToTray).toHaveBeenCalledWith(0, expect.objectContaining({ x: expect.any(Number) }));
    expect(host.changed).toHaveBeenLastCalledWith(null);
    expect(host.place).not.toHaveBeenCalled();
  });

  it("does nothing when no Piece is being dragged", () => {
    const { host, drag } = setup();

    drag.cancel();

    expect(host.returnToTray).not.toHaveBeenCalled();
    expect(host.changed).not.toHaveBeenCalled();
  });

  it("leaves the next Drag working as before", () => {
    const { canvas, host, drag, dragOverBoard, overBoard } = setup();
    dragOverBoard();
    drag.cancel();

    dragOverBoard();
    pointer(canvas, "pointerup", overBoard.x, overBoard.y);

    expect(host.place).toHaveBeenCalledTimes(1);
  });
});
