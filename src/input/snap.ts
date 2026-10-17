// Snap: a dragged Piece that doesn't fit where it is drawn gets the nearest Board origin
// within reach where it does fit. Pure: the core's fit query decides what fits.
import type { Position } from "../core";

export interface SnapTuning {
  /** How far a Snap may reach, in Cells, from where the Piece is drawn. */
  readonly reach: number;
  /** How much closer, in Cells, another spot must be before the Ghost leaves its current one. */
  readonly stickiness: number;
}

/**
 * The origin for a Piece drawn at the unrounded Board position `at` (in Cells): the nearest
 * fitting origin within reach, keeping `current` unless another is closer by the stickiness.
 * With nothing in reach, the plain nearest Cell, which the core then rejects.
 */
export function snapOrigin(
  at: { readonly row: number; readonly col: number },
  fits: (origin: Position) => boolean,
  current: Position | null,
  { reach, stickiness }: SnapTuning,
): Position {
  const distance = (o: Position) => Math.hypot(o.row - at.row, o.col - at.col);
  let best: { origin: Position; distance: number } | null = null;
  for (let row = Math.ceil(at.row - reach); row <= Math.floor(at.row + reach); row++) {
    for (let col = Math.ceil(at.col - reach); col <= Math.floor(at.col + reach); col++) {
      const origin = { row, col };
      const d = distance(origin);
      if (d <= reach && (!best || d < best.distance) && fits(origin)) best = { origin, distance: d };
    }
  }
  if (!best) return { row: Math.round(at.row), col: Math.round(at.col) };
  if (current && distance(current) <= reach && distance(current) - best.distance < stickiness && fits(current)) {
    return current;
  }
  return best.origin;
}
