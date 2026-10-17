import { describe, expect, it } from "vitest";
import type { Position } from "../core";
import { snapOrigin } from "./snap";

const tuning = { reach: 1.5, stickiness: 0.25 };
/** A fit query that accepts only the listed origins. */
const fitsAt =
  (...spots: Position[]) =>
  (o: Position) =>
    spots.some((s) => s.row === o.row && s.col === o.col);

describe("Snap", () => {
  it("keeps the nearest Cell when the Piece fits where it is drawn", () => {
    const fits = fitsAt({ row: 3, col: 4 }, { row: 3, col: 5 });
    expect(snapOrigin({ row: 3.2, col: 4.3 }, fits, null, tuning)).toEqual({ row: 3, col: 4 });
  });

  it("moves to a neighbouring spot that fits when the drawn one doesn't", () => {
    const fits = fitsAt({ row: 4, col: 4 });
    expect(snapOrigin({ row: 3, col: 4 }, fits, null, tuning)).toEqual({ row: 4, col: 4 });
  });

  it("picks the nearest of several fitting spots, measured from the unrounded position", () => {
    // From (3.4, 4): (2, 4) is 1.4 away, (5, 4) is 1.6 (out of reach), (3, 5) is ~1.08.
    const fits = fitsAt({ row: 2, col: 4 }, { row: 3, col: 5 }, { row: 5, col: 4 });
    expect(snapOrigin({ row: 3.4, col: 4 }, fits, null, tuning)).toEqual({ row: 3, col: 5 });
  });

  it("prefers a spot straight across to one diagonally away", () => {
    const fits = fitsAt({ row: 4, col: 5 }, { row: 3, col: 5 });
    expect(snapOrigin({ row: 3, col: 4 }, fits, null, tuning)).toEqual({ row: 3, col: 5 });
  });

  it("falls back to the plain nearest Cell when nothing fits within reach", () => {
    const fits = fitsAt({ row: 6, col: 4 });
    expect(snapOrigin({ row: 3.2, col: 3.6 }, fits, null, tuning)).toEqual({ row: 3, col: 4 });
  });

  it("stays on the current spot unless another is clearly closer", () => {
    const fits = fitsAt({ row: 3, col: 3 }, { row: 3, col: 4 });
    // (3, 4) is 0.1 closer than the current (3, 3): not enough to move.
    expect(snapOrigin({ row: 3, col: 3.55 }, fits, { row: 3, col: 3 }, tuning)).toEqual({ row: 3, col: 3 });
    // Now 0.4 closer: move.
    expect(snapOrigin({ row: 3, col: 3.7 }, fits, { row: 3, col: 3 }, tuning)).toEqual({ row: 3, col: 4 });
  });

  it("lets go of the current spot once it no longer fits or is out of reach", () => {
    const fits = fitsAt({ row: 3, col: 4 }, { row: 0, col: 0 });
    expect(snapOrigin({ row: 3, col: 3.9 }, fits, { row: 3, col: 3 }, tuning)).toEqual({ row: 3, col: 4 });
    expect(snapOrigin({ row: 3, col: 3.9 }, fits, { row: 0, col: 0 }, tuning)).toEqual({ row: 3, col: 4 });
  });
});
