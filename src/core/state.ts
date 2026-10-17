import type { Piece } from "./pieces";
import type { RngState } from "./rng";

/** The Board is always 8×8 (Block Blast Classic). A rule, not a tuning number. */
export const BOARD_SIZE = 8;

/** Number of Tray slots. */
export const TRAY_SIZE = 3;

/** Block colors are indices `0 .. COLOR_COUNT-1`; a Skin maps each to a real color. */
export const COLOR_COUNT = 7;

/** A Cell is empty (`null`) or filled with a block of the given color index. */
export type Cell = number | null;

/** Rows of Cells, indexed `board[row][col]`. */
export type Board = readonly (readonly Cell[])[];

/** A Piece offered in the Tray, with the color its blocks will have. */
export interface TrayPiece {
  readonly piece: Piece;
  readonly color: number;
}

/** Always `TRAY_SIZE` slots; a placed Piece leaves `null` in its slot. */
export type Tray = readonly (TrayPiece | null)[];

export interface GameState {
  readonly board: Board;
  readonly tray: Tray;
  /** Seeded random source state; advanced by dealing. */
  readonly rng: RngState;
  /** Points earned in this Run. */
  readonly score: number;
  /** Best Score: the highest score reached in any Run (kept up to date mid-Run). */
  readonly best: number;
  /**
   * The Best Score as it stood when this Run started. NEW BEST fires the first
   * time the score passes it (never when it is 0). `best` moves mid-Run; this doesn't.
   */
  readonly runStartBest: number;
  /** Combo level: +1 per Placement that Clears; 0 = no streak. */
  readonly combo: number;
  /** Placements in a row without a Clear (reset by a Clear). */
  readonly dry: number;
  /** Game Over: no remaining Tray Piece fits. Final; Placements are then rejected. */
  readonly over: boolean;
}

export function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => null),
  );
}
