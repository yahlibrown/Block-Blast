// Snap back (spec story 18): a Piece dropped where it doesn't fit flies back to its Tray
// slot instead of popping there. Pure tween; the shell runs it through the frame loop.

/** How long the flight back takes, in ms. UI feel, not core balance. */
export const SNAP_BACK_MS = 160;

/** A Piece drawn with its top-left at (x, y), in CSS px, at `cellSize` px per Cell. */
export interface PieceAt {
  readonly x: number;
  readonly y: number;
  readonly cellSize: number;
}

/** Where the Piece is drawn `elapsed` ms after it was released at `from`; null once it is home at `to`. */
export function snapBackAt(from: PieceAt, to: PieceAt, elapsed: number): PieceAt | null {
  if (elapsed >= SNAP_BACK_MS) return null;
  const t = easeOutCubic(Math.max(0, elapsed) / SNAP_BACK_MS);
  const mix = (a: number, b: number) => a + (b - a) * t;
  return { x: mix(from.x, to.x), y: mix(from.y, to.y), cellSize: mix(from.cellSize, to.cellSize) };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}
