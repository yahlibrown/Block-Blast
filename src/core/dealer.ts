// Dealer: deals a Tray of three from the seeded random source.
// For now plain uniform random (fair dealing is ticket 06, which replaces the
// body of `dealTray` and may read `board`).
import { PIECES, PIECE_IDS } from "./pieces";
import { nextInt, type RngState } from "./rng";
import { COLOR_COUNT, TRAY_SIZE, type Board, type Tray, type TrayPiece } from "./state";

export function dealTray(_board: Board, rng: RngState): [Tray, RngState] {
  const tray: TrayPiece[] = [];
  let state = rng;
  for (let i = 0; i < TRAY_SIZE; i++) {
    let pick: number;
    let color: number;
    [pick, state] = nextInt(state, PIECE_IDS.length);
    [color, state] = nextInt(state, COLOR_COUNT);
    tray.push({ piece: PIECES[PIECE_IDS[pick]!], color });
  }
  return [tray, state];
}
