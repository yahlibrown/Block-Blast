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
}

export function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => null),
  );
}
