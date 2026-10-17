// Public seam of the game core. Tests and the shell import only from here.
// The core is pure: no DOM, timers, audio or storage (enforced by tsconfig.core.json).
import { dealTray } from "./dealer";
import { seedRng } from "./rng";
import { emptyBoard, type GameState } from "./state";

export {
  BOARD_SIZE,
  COLOR_COUNT,
  TRAY_SIZE,
  type Board,
  type Cell,
  type GameState,
  type Tray,
  type TrayPiece,
} from "./state";
export { PIECES, PIECE_IDS, type Piece, type PieceId, type Position } from "./pieces";
export { clearPoints } from "./scoring";
export {
  attemptPlacement,
  queryFit,
  trayFits,
  type ColoredPosition,
  type FitResult,
  type GameEvent,
  type PlacementResult,
  type RejectReason,
} from "./placement";
export {
  InvalidSaveError,
  restore,
  SAVE_VERSION,
  serialize,
  type SaveData,
  type SavedTrayPiece,
} from "./save";

export interface CreateOptions {
  /** Seed for the core's random source (drives dealing). */
  readonly seed: number;
  /** Best Score carried in from earlier Runs. Defaults to 0. (Ticket 13 may fold this into a profile.) */
  readonly best?: number;
}

/** Start a new Run: empty Board and a freshly dealt Tray. */
export function create(options: CreateOptions): GameState {
  const board = emptyBoard();
  const [tray, rng] = dealTray(board, seedRng(options.seed));
  return { board, tray, rng, score: 0, best: options.best ?? 0, combo: 0, dry: 0 };
}
