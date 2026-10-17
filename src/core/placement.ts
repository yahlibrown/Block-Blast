// Placement, Clear and the fit queries.
import { dealTray } from "./dealer";
import type { Piece, PieceId, Position } from "./pieces";
import { BOARD_CLEAR_BONUS, blockPoints, clearPoints, stepCombo } from "./scoring";
import { paletteLevelFor } from "./palette";
import { BOARD_SIZE, type Board, type GameState, type Tray } from "./state";

/** Why a Placement was refused. "game-over": the Run has ended. */
export type RejectReason = "empty-slot" | "out-of-bounds" | "overlap" | "game-over";

/** A Cell that held a block, with that block's color. */
export interface ColoredPosition extends Position {
  readonly color: number;
}

/**
 * Events from one Placement, in this order (later tickets slot theirs in
 * between, per the spec): piecePlaced, linesCleared?, …, trayDealt?, …
 */
export type GameEvent =
  | {
      readonly type: "piecePlaced";
      readonly slot: number;
      readonly piece: PieceId;
      readonly color: number;
      readonly origin: Position;
      /** Board Cells the Piece now fills. */
      readonly cells: readonly Position[];
      readonly blocks: number;
      /** Block points scored by this Placement. */
      readonly points: number;
    }
  | {
      readonly type: "linesCleared";
      /** Full rows and columns cleared, ascending. */
      readonly rows: readonly number[];
      readonly cols: readonly number[];
      /** Multi-Clear size: rows.length + cols.length. */
      readonly lines: number;
      /** Every Cell emptied, with the color it had (each Cell once). */
      readonly cells: readonly ColoredPosition[];
      /** Combo level this Clear was multiplied by (after this Clear's increment). */
      readonly multiplier: number;
      /** Clear points scored: the Multi-Clear size's points × multiplier. */
      readonly points: number;
    }
  | {
      /** A Clear grew the Combo. */
      readonly type: "comboIncreased";
      /** New Combo level (1 on the first Clear of a streak). */
      readonly level: number;
    }
  | {
      /** The third Placement in a row without a Clear reset the Combo to 0. */
      readonly type: "comboBroken";
      /** The Combo level that was lost. */
      readonly level: number;
    }
  | {
      /** A Clear left the Board fully empty. */
      readonly type: "boardClear";
      readonly bonus: number;
    }
  | {
      /** The score passed one or more Palette Shift thresholds (after any Board Clear bonus). */
      readonly type: "paletteShift";
      /** New Palette Shift level (1 after the first threshold). */
      readonly level: number;
    }
  | {
      /** The score passed the Best Score held at the start of the Run. At most once per Run; never if that was 0. */
      readonly type: "newBest";
      /** The score after this Placement. */
      readonly score: number;
      /** The Best Score the Run started with (the one just beaten). */
      readonly previous: number;
    }
  | {
      readonly type: "trayDealt";
      readonly tray: Tray;
    }
  | {
      /** No remaining Tray Piece fits (checked after the Placement and any deal). Always last. */
      readonly type: "gameOver";
    };

export type PlacementResult =
  | { readonly ok: true; readonly state: GameState; readonly events: readonly GameEvent[] }
  | { readonly ok: false; readonly reason: RejectReason };

export type FitResult =
  | {
      readonly fits: true;
      /** Board Cells the Piece would fill. */
      readonly cells: readonly Position[];
      /** Lines that would Clear, ascending. */
      readonly rows: readonly number[];
      readonly cols: readonly number[];
    }
  | { readonly fits: false; readonly reason: RejectReason };

/**
 * Would the Piece in `slot` fit with its top-left at `origin`, and which Lines
 * would it Clear? Never changes state; drives the ghost preview and highlights.
 */
export function queryFit(state: GameState, slot: number, origin: Position): FitResult {
  const entry = state.tray[slot];
  if (!entry) return { fits: false, reason: "empty-slot" };
  return fitPiece(state.board, entry.piece, origin);
}

/** For each Tray slot: does its Piece fit anywhere on the Board? (`false` if empty.) */
export function trayFits(state: GameState): boolean[] {
  return state.tray.map((entry) => entry !== null && fitsAnywhere(state.board, entry.piece));
}

/** Place the Piece in `slot` with its top-left at `origin`. */
export function attemptPlacement(
  state: GameState,
  slot: number,
  origin: Position,
): PlacementResult {
  if (state.over) return { ok: false, reason: "game-over" };
  const fit = queryFit(state, slot, origin);
  if (!fit.fits) return { ok: false, reason: fit.reason };
  const entry = state.tray[slot]!;
  const events: GameEvent[] = [];

  const board = state.board.map((row) => [...row]);
  for (const { row, col } of fit.cells) board[row]![col] = entry.color;
  events.push({
    type: "piecePlaced",
    slot,
    piece: entry.piece.id,
    color: entry.color,
    origin: { row: origin.row, col: origin.col },
    cells: fit.cells,
    blocks: fit.cells.length,
    points: blockPoints(fit.cells.length),
  });
  let score = state.score + blockPoints(fit.cells.length);

  const lines = fit.rows.length + fit.cols.length;
  const combo = stepCombo(state.combo, state.dry, lines > 0);
  if (lines > 0) {
    const cleared: ColoredPosition[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (fit.rows.includes(row) || fit.cols.includes(col)) {
          cleared.push({ row, col, color: board[row]![col]! });
          board[row]![col] = null;
        }
      }
    }
    events.push({
      type: "linesCleared",
      rows: fit.rows,
      cols: fit.cols,
      lines,
      cells: cleared,
      multiplier: combo.combo,
      points: clearPoints(lines) * combo.combo,
    });
    score += clearPoints(lines) * combo.combo;
    events.push({ type: "comboIncreased", level: combo.combo });
    if (board.every((row) => row.every((cell) => cell === null))) {
      events.push({ type: "boardClear", bonus: BOARD_CLEAR_BONUS });
      score += BOARD_CLEAR_BONUS;
    }
  } else if (combo.broke !== null) {
    events.push({ type: "comboBroken", level: combo.broke });
  }
  // Palette Shift: one event with the final level, even if one Placement passes several thresholds.
  const paletteLevel = Math.max(state.paletteLevel, paletteLevelFor(score));
  if (paletteLevel > state.paletteLevel) events.push({ type: "paletteShift", level: paletteLevel });
  const previous = state.runStartBest;
  if (previous > 0 && state.score <= previous && score > previous) {
    events.push({ type: "newBest", score, previous });
  }
  // (Ticket 13) skinUnlocked slots in here, after newBest and before trayDealt.

  let tray: Tray = state.tray.map((t, i) => (i === slot ? null : t));
  let rng = state.rng;
  if (tray.every((t) => t === null)) {
    [tray, rng] = dealTray(board, rng);
    events.push({ type: "trayDealt", tray });
  }

  const next: GameState = {
    ...state,
    board,
    tray,
    rng,
    score,
    best: Math.max(state.best, score),
    combo: combo.combo,
    dry: combo.dry,
    paletteLevel,
  };
  const over = !trayFits(next).some(Boolean);
  if (over) events.push({ type: "gameOver" });

  return { ok: true, state: { ...next, over }, events };
}

function fitPiece(board: Board, piece: Piece, origin: Position): FitResult {
  const cells = piece.blocks.map((b) => ({ row: origin.row + b.row, col: origin.col + b.col }));
  if (cells.some(({ row, col }) => !inside(row) || !inside(col))) {
    return { fits: false, reason: "out-of-bounds" };
  }
  if (cells.some(({ row, col }) => board[row]![col] !== null)) {
    return { fits: false, reason: "overlap" };
  }
  const filled = (row: number, col: number): boolean =>
    board[row]![col] !== null || cells.some((c) => c.row === row && c.col === col);
  const rows = range().filter((row) => range().every((col) => filled(row, col)));
  const cols = range().filter((col) => range().every((row) => filled(row, col)));
  return { fits: true, cells, rows, cols };
}

function fitsAnywhere(board: Board, piece: Piece): boolean {
  for (let row = 0; row <= BOARD_SIZE - piece.rows; row++) {
    for (let col = 0; col <= BOARD_SIZE - piece.cols; col++) {
      if (fitPiece(board, piece, { row, col }).fits) return true;
    }
  }
  return false;
}

function inside(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < BOARD_SIZE;
}

function range(): number[] {
  return Array.from({ length: BOARD_SIZE }, (_, i) => i);
}

