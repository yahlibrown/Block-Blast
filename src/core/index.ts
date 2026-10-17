// Public seam of the game core. Tests and the shell import only from here.
// The core is pure: no DOM, timers, audio or storage (enforced by tsconfig.core.json).
import { dealTray } from "./dealer";
import { seedRng } from "./rng";
import { SKINS, unlockedSkins, type Profile, type SkinUnlock } from "./skins";
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
export { isSkinId, SKINS, type Profile, type SkinId, type SkinUnlock } from "./skins";
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

/** A profile as handed to `create` (e.g. read back from storage): every field optional. */
export interface ProfileInput {
  readonly best?: number;
  readonly lifetime?: number;
  /** Unlocked Skin ids; unknown ids are ignored. */
  readonly unlocked?: readonly string[];
}

export interface CreateOptions {
  /** Seed for the core's random source (drives dealing). */
  readonly seed: number;
  /** Best Score, Lifetime Points and unlocked Skins from earlier Runs. Defaults to a new player. */
  readonly profile?: ProfileInput;
}

/** Start a new Run: empty Board and a freshly dealt Tray. */
export function create(options: CreateOptions): GameState {
  const board = emptyBoard();
  const [tray, rng] = dealTray(board, seedRng(options.seed));
  const best = options.profile?.best ?? 0;
  const lifetime = options.profile?.lifetime ?? 0;
  return {
    board,
    tray,
    rng,
    score: 0,
    best,
    runStartBest: best,
    combo: 0,
    dry: 0,
    over: false,
    paletteLevel: 0,
    lifetime,
    unlocked: unlockedSkins(options.profile?.unlocked ?? [], lifetime),
    runUnlocked: [],
  };
}

/** The long-term progress in `state`, to store and to start the next Run from. */
export function profileOf(state: GameState): Profile {
  return { best: state.best, lifetime: state.lifetime, unlocked: [...state.unlocked] };
}

export interface SkinProgress {
  /** Lifetime Points counting this Run's score (whether or not it is over yet). */
  readonly points: number;
  /** The cheapest Skin still locked, or null when all are unlocked. */
  readonly next: SkinUnlock | null;
  /** Where the bar toward `next` starts: the threshold of the Skin before it. */
  readonly from: number;
}

/** Progress toward the next Skin (the Game Over progress bar). */
export function skinProgress(state: GameState): SkinProgress {
  const points = state.over ? state.lifetime : state.lifetime + state.score;
  const index = SKINS.findIndex((s) => !state.unlocked.includes(s.id));
  if (index < 0) return { points, next: null, from: SKINS.at(-1)?.threshold ?? 0 };
  return { points, next: SKINS[index]!, from: SKINS[index - 1]?.threshold ?? 0 };
}
