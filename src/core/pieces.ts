// Piece catalogue: Block Blast's standard shapes. Pieces never rotate, so each
// orientation is its own entry. Shapes are drawn as art (`#` = block).

/** A Cell position on the Board, or a block offset within a Piece. */
export interface Position {
  readonly row: number;
  readonly col: number;
}

export interface Piece {
  readonly id: PieceId;
  /** Block offsets from the Piece's top-left corner (its origin). */
  readonly blocks: readonly Position[];
  /** Bounding box, in Cells. */
  readonly rows: number;
  readonly cols: number;
}

const ART = {
  // Single block
  dot: ["#"],
  // Straight Lines, 2 to 5 long
  h2: ["##"],
  v2: ["#", "#"],
  h3: ["###"],
  v3: ["#", "#", "#"],
  h4: ["####"],
  v4: ["#", "#", "#", "#"],
  h5: ["#####"],
  v5: ["#", "#", "#", "#", "#"],
  // Squares and rectangles
  sq2: ["##", "##"],
  sq3: ["###", "###", "###"],
  rect2x3: ["###", "###"],
  rect3x2: ["##", "##", "##"],
  // Small corners (3 blocks)
  corner2TL: ["##", "#."],
  corner2TR: ["##", ".#"],
  corner2BL: ["#.", "##"],
  corner2BR: [".#", "##"],
  // Big corners (5 blocks)
  corner3TL: ["###", "#..", "#.."],
  corner3TR: ["###", "..#", "..#"],
  corner3BL: ["#..", "#..", "###"],
  corner3BR: ["..#", "..#", "###"],
  // L and J (4 blocks), every orientation
  lUp: ["#.", "#.", "##"],
  lRight: ["###", "#.."],
  lDown: ["##", ".#", ".#"],
  lLeft: ["..#", "###"],
  jUp: [".#", ".#", "##"],
  jRight: ["#..", "###"],
  jDown: ["##", "#.", "#."],
  jLeft: ["###", "..#"],
  // T (4 blocks), every orientation
  tUp: [".#.", "###"],
  tDown: ["###", ".#."],
  tLeft: [".#", "##", ".#"],
  tRight: ["#.", "##", "#."],
  // S and Z (4 blocks), both orientations
  sH: [".##", "##."],
  sV: ["#.", "##", ".#"],
  zH: ["##.", ".##"],
  zV: [".#", "##", "#."],
} as const satisfies Record<string, readonly string[]>;

export type PieceId = keyof typeof ART;

function fromArt(id: PieceId, art: readonly string[]): Piece {
  const blocks: Position[] = [];
  art.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === "#") blocks.push({ row, col });
    });
  });
  return { id, blocks, rows: art.length, cols: Math.max(...art.map((l) => l.length)) };
}

/** Every Piece, keyed by id. */
export const PIECES: Readonly<Record<PieceId, Piece>> = Object.fromEntries(
  (Object.keys(ART) as PieceId[]).map((id) => [id, fromArt(id, ART[id])]),
) as Record<PieceId, Piece>;

/** Every Piece id, in catalogue order. */
export const PIECE_IDS: readonly PieceId[] = Object.keys(ART) as PieceId[];

export function isPieceId(value: unknown): value is PieceId {
  return typeof value === "string" && Object.hasOwn(ART, value);
}
