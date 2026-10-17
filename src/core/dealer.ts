// Dealer: deals a Tray of three from the seeded random source, against the
// Board as it is at deal time.
// - Fit guarantee: if any catalogue Piece fits the Board, at least one dealt
//   Piece does (otherwise one random slot is re-dealt from the fitting Pieces).
// - Line bias: a Piece that could complete a Line somewhere is weighted
//   `1 + TUNING.dealer.lineBias` instead of 1 (0 turns the bias off).
import { TUNING } from "../tuning/tuning";
import { PIECES, PIECE_IDS, type Piece } from "./pieces";
import { nextFloat, nextInt, type RngState } from "./rng";
import { BOARD_SIZE, COLOR_COUNT, TRAY_SIZE, type Board, type Tray, type TrayPiece } from "./state";

interface Candidate {
  readonly piece: Piece;
  readonly fits: boolean;
  readonly completesLine: boolean;
}

export function dealTray(board: Board, rng: RngState): [Tray, RngState] {
  const all = PIECE_IDS.map((id) => assess(board, PIECES[id]));
  const picked: Candidate[] = [];
  const tray: TrayPiece[] = [];
  let state = rng;
  for (let i = 0; i < TRAY_SIZE; i++) {
    let candidate: Candidate;
    let color: number;
    [candidate, state] = pickWeighted(all, state);
    [color, state] = nextInt(state, COLOR_COUNT);
    picked.push(candidate);
    tray.push({ piece: candidate.piece, color });
  }

  const fitting = all.filter((c) => c.fits);
  if (fitting.length > 0 && !picked.some((c) => c.fits)) {
    let slot: number;
    let candidate: Candidate;
    [slot, state] = nextInt(state, TRAY_SIZE);
    [candidate, state] = pickWeighted(fitting, state);
    tray[slot] = { piece: candidate.piece, color: tray[slot]!.color };
  }
  return [tray, state];
}

function weight(candidate: Candidate): number {
  return candidate.completesLine ? 1 + TUNING.dealer.lineBias : 1;
}

function pickWeighted(candidates: readonly Candidate[], rng: RngState): [Candidate, RngState] {
  const total = candidates.reduce((sum, c) => sum + weight(c), 0);
  const [f, next] = nextFloat(rng);
  let target = f * total;
  for (const c of candidates) {
    target -= weight(c);
    if (target < 0) return [c, next];
  }
  return [candidates[candidates.length - 1]!, next];
}

/** Does `piece` fit anywhere, and could some Placement of it complete a Line? */
function assess(board: Board, piece: Piece): Candidate {
  let fits = false;
  for (let row = 0; row <= BOARD_SIZE - piece.rows; row++) {
    for (let col = 0; col <= BOARD_SIZE - piece.cols; col++) {
      const cells = piece.blocks.map((b) => ({ row: row + b.row, col: col + b.col }));
      if (cells.some((c) => board[c.row]![c.col] !== null)) continue;
      fits = true;
      if (completesLine(board, cells)) return { piece, fits, completesLine: true };
    }
  }
  return { piece, fits, completesLine: false };
}

function completesLine(board: Board, cells: readonly { row: number; col: number }[]): boolean {
  const filled = (row: number, col: number): boolean =>
    board[row]![col] !== null || cells.some((c) => c.row === row && c.col === col);
  return cells.some(
    ({ row, col }) =>
      lineFull((i) => filled(row, i)) || lineFull((i) => filled(i, col)),
  );
}

function lineFull(filledAt: (i: number) => boolean): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) if (!filledAt(i)) return false;
  return true;
}
