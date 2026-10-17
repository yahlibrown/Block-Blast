// Serialize / restore: the full core state as versioned plain (JSON-safe) data.
// Tests build Boards and Trays through `restore`; persistence (ticket 08) stores
// the output of `serialize`.
import { isPieceId, PIECES, type PieceId } from "./pieces";
import {
  BOARD_SIZE,
  COLOR_COUNT,
  TRAY_SIZE,
  type Cell,
  type GameState,
  type TrayPiece,
} from "./state";

export const SAVE_VERSION = 1;

export interface SavedTrayPiece {
  readonly piece: PieceId;
  readonly color: number;
}

/**
 * Plain-data form of a GameState. `serialize` always writes every field.
 * `restore` requires only `version`, `board` and `tray`; every other field is
 * optional and defaults to its fresh-Run value, so a test states just what
 * matters to its scenario. Later tickets add optional fields here.
 */
export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  /** 8 rows of 8 Cells: `null` or a color index. */
  readonly board: readonly (readonly Cell[])[];
  /** Exactly 3 slots. */
  readonly tray: readonly (SavedTrayPiece | null)[];
  /** Random source state. Defaults to 0. */
  readonly rng?: number;
  /** Score in this Run. Defaults to 0. */
  readonly score?: number;
  /** Best Score. Defaults to 0. */
  readonly best?: number;
  /** Combo level. Defaults to 0. */
  readonly combo?: number;
  /** Placements in a row without a Clear. Defaults to 0. */
  readonly dry?: number;
}

export class InvalidSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSaveError";
  }
}

export function serialize(state: GameState): Required<SaveData> {
  return {
    version: SAVE_VERSION,
    board: state.board.map((row) => [...row]),
    tray: state.tray.map((t) => (t ? { piece: t.piece.id, color: t.color } : null)),
    rng: state.rng,
    score: state.score,
    best: state.best,
    combo: state.combo,
    dry: state.dry,
  };
}

/**
 * Rebuild a GameState from plain data. Validates at runtime (the input may come
 * from storage) and throws `InvalidSaveError` on a wrong version or bad shape.
 */
export function restore(data: SaveData): GameState {
  const d = data as unknown as Record<string, unknown>;
  if (typeof d !== "object" || d === null) fail("not an object");
  if (d.version !== SAVE_VERSION) fail(`unsupported version ${String(d.version)}`);

  const board = d.board;
  if (!Array.isArray(board) || board.length !== BOARD_SIZE) fail("board must have 8 rows");
  const cells = board.map((row: unknown) => {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) fail("board rows must have 8 Cells");
    return row.map((cell: unknown): Cell => {
      if (cell === null) return null;
      if (isColor(cell)) return cell;
      return fail(`bad Cell ${String(cell)}`);
    });
  });

  const tray = d.tray;
  if (!Array.isArray(tray) || tray.length !== TRAY_SIZE) fail("tray must have 3 slots");
  const slots = tray.map((slot: unknown): TrayPiece | null => {
    if (slot === null) return null;
    const s = slot as Record<string, unknown>;
    if (typeof s !== "object" || !isPieceId(s.piece) || !isColor(s.color)) {
      return fail("bad Tray slot");
    }
    return { piece: PIECES[s.piece], color: s.color };
  });

  const rng = d.rng ?? 0;
  if (typeof rng !== "number" || !Number.isInteger(rng)) fail("bad rng");

  const score = count(d.score, "score");
  const best = Math.max(count(d.best, "best"), score);
  const combo = count(d.combo, "combo");
  const dry = count(d.dry, "dry");

  return { board: cells, tray: slots, rng: rng >>> 0, score, best, combo, dry };
}

/** An optional non-negative integer field; missing means 0. */
function count(v: unknown, name: string): number {
  if (v === undefined) return 0;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) fail(`bad ${name}`);
  return v;
}

function isColor(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < COLOR_COUNT;
}

function fail(message: string): never {
  throw new InvalidSaveError(message);
}
