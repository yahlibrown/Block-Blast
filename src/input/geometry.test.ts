import { describe, expect, it } from "vitest";
import { boardOrigin, liftedTopLeft } from "./geometry";

const board = { x: 20, y: 100, cellSize: 40 };

describe("the Board origin under a dragged Piece", () => {
  it("snaps the Piece's top-left to the nearest Cell", () => {
    expect(boardOrigin(board, { x: 20, y: 100 })).toEqual({ row: 0, col: 0 });
    expect(boardOrigin(board, { x: 20 + 40 * 3 + 19, y: 100 + 40 * 2 - 19 })).toEqual({ row: 2, col: 3 });
    expect(boardOrigin(board, { x: 20 + 40 * 3 + 21, y: 100 + 40 * 2 + 21 })).toEqual({ row: 3, col: 4 });
  });

  it("can land off the Board, so the core rejects it", () => {
    expect(boardOrigin(board, { x: -30, y: 10 })).toEqual({ row: -2, col: -1 });
  });
});

describe("the dragged Piece's position", () => {
  it("is centered on the finger and floats above it", () => {
    // 2 cols × 3 rows at 40px Cells, bottom edge 60px above the finger.
    expect(liftedTopLeft({ x: 200, y: 500 }, { rows: 3, cols: 2 }, 40, 60)).toEqual({ x: 160, y: 320 });
  });
});
