import { describe, expect, it } from "vitest";
import { amplifiedTopLeft, boardOrigin, clampOnScreen, liftedTopLeft } from "./geometry";

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

describe("an amplified Drag", () => {
  const grab = { x: 200, y: 600 };
  const lifted = { x: 160, y: 420 };

  it("moves the Piece `gain` times as far as the finger has moved since the grab", () => {
    expect(amplifiedTopLeft(lifted, grab, { x: 220, y: 500 }, 1.5)).toEqual({ x: 190, y: 270 });
  });

  it("leaves the Piece where it was lifted until the finger moves", () => {
    expect(amplifiedTopLeft(lifted, grab, grab, 1.5)).toEqual(lifted);
  });

  it("tracks the finger 1:1 at a gain of 1", () => {
    expect(amplifiedTopLeft(lifted, grab, { x: 170, y: 450 }, 1)).toEqual({ x: 130, y: 270 });
  });
});

describe("a dragged Piece near the screen edge", () => {
  const screen = { width: 400, height: 800 };
  const piece = { width: 120, height: 80 };

  it("stays fully on screen", () => {
    expect(clampOnScreen({ x: -50, y: -10 }, piece, screen)).toEqual({ x: 0, y: 0 });
    expect(clampOnScreen({ x: 350, y: 790 }, piece, screen)).toEqual({ x: 280, y: 720 });
  });

  it("is left alone when already on screen", () => {
    expect(clampOnScreen({ x: 100, y: 300 }, piece, screen)).toEqual({ x: 100, y: 300 });
  });
});
