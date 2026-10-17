// Public seam of the game core. Tests and the shell import only from here.
// The core is pure: no DOM, timers, audio or storage (enforced by tsconfig.core.json).

/** The Board is always 8×8 (Block Blast Classic). A rule, not a tuning number. */
export const BOARD_SIZE = 8;

/** A Cell is empty (`null`) or filled with a block of the given color index. */
export type Cell = number | null;

/** Rows of Cells, indexed `board[row][column]`. */
export type Board = readonly (readonly Cell[])[];

export interface GameState {
  readonly board: Board;
}

export interface CreateOptions {
  /** Seed for the core's random source (used by dealing in later tickets). */
  readonly seed: number;
}

/** Start a new Run. */
export function create(_options: CreateOptions): GameState {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => null),
  );
  return { board };
}
