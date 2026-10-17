// Snap: a dragged Piece that doesn't fit where it is drawn gets the nearest Board origin
// within reach where it does fit. Pure: the core's fit query decides what fits.
import type { Position } from "../core";
import type { BoardPoint } from "./geometry";

/** Distances this close, in Cells, count as a tie. */
const EPSILON = 1e-9;

export interface SnapTuning {
  /** How far a Snap may reach, in Cells, from where the Piece is drawn. */
  readonly reach: number;
  /** How much closer, in Cells, another spot must be before the Ghost leaves its current one. */
  readonly stickiness: number;
}

/**
 * The origin for a Piece drawn at the unrounded Board position `at` (in Cells):
 * - the nearest Cell, whenever the Piece fits there;
 * - otherwise the nearest fitting origin within reach, keeping `current` unless another is
 *   closer by the stickiness, and breaking ties for the lower spot (closer to the thumb);
 * - with nothing in reach, the nearest Cell anyway, which the core then rejects.
 */
export function snapOrigin(
  at: BoardPoint,
  fits: (origin: Position) => boolean,
  current: Position | null,
  { reach, stickiness }: SnapTuning,
): Position {
  const nearest = { row: Math.round(at.row), col: Math.round(at.col) };
  if (fits(nearest)) return nearest;
  const distance = (o: Position) => Math.hypot(o.row - at.row, o.col - at.col);
  const closer = (d: number, origin: Position, than: { origin: Position; distance: number }) =>
    d < than.distance - EPSILON || (Math.abs(d - than.distance) <= EPSILON && origin.row > than.origin.row);
  let best: { origin: Position; distance: number } | null = null;
  for (let row = Math.ceil(at.row - reach); row <= Math.floor(at.row + reach); row++) {
    for (let col = Math.ceil(at.col - reach); col <= Math.floor(at.col + reach); col++) {
      const origin = { row, col };
      const d = distance(origin);
      if (d <= reach && (!best || closer(d, origin, best)) && fits(origin)) best = { origin, distance: d };
    }
  }
  if (!best) return nearest;
  if (current && distance(current) <= reach && distance(current) - best.distance < stickiness && fits(current)) {
    return current;
  }
  return best.origin;
}
