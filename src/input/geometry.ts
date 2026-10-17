// Pure drag geometry: where the dragged Piece is drawn and which Board origin it maps to.
// No DOM, no rules: the core decides whether the Piece fits at that origin.
import type { Position } from "../core";
import type { BoardLayout } from "../renderer/renderer";

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Top-left of a dragged Piece drawn at `cellSize`: centered on the finger
 * horizontally, with its bottom edge `lift` px above it so the thumb doesn't hide it.
 */
export function liftedTopLeft(
  finger: Point,
  piece: { readonly rows: number; readonly cols: number },
  cellSize: number,
  lift: number,
): Point {
  return {
    x: finger.x - (piece.cols * cellSize) / 2,
    y: finger.y - piece.rows * cellSize - lift,
  };
}

/** Board origin (top-left Cell) for a Piece whose top-left is drawn at `topLeft`: the nearest Cell. */
export function boardOrigin(board: BoardLayout, topLeft: Point): Position {
  return {
    row: Math.round((topLeft.y - board.y) / board.cellSize),
    col: Math.round((topLeft.x - board.x) / board.cellSize),
  };
}

/**
 * Top-left of an amplified Drag: the Piece moves `gain`× as far from where it was
 * lifted as the finger has moved from where it grabbed, so a short thumb movement covers the Board.
 */
export function amplifiedTopLeft(lifted: Point, grab: Point, finger: Point, gain: number): Point {
  return {
    x: lifted.x + (finger.x - grab.x) * gain,
    y: lifted.y + (finger.y - grab.y) * gain,
  };
}

/** Keep a Piece of `size` px fully inside the `screen`, even if the finger goes further. */
export function clampOnScreen(
  topLeft: Point,
  size: { readonly width: number; readonly height: number },
  screen: { readonly width: number; readonly height: number },
): Point {
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max));
  return { x: clamp(topLeft.x, screen.width - size.width), y: clamp(topLeft.y, screen.height - size.height) };
}
