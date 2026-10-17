// Canvas 2D renderer. Draws game state; holds no game rules.
import type { Board, Cell, FitResult, GameState, Piece, Position } from "../core";
import { BASE_BACKDROP, withAlpha, type Backdrop } from "./palette";

export interface BoardLayout {
  /** Top-left of the Board, in CSS pixels. */
  readonly x: number;
  readonly y: number;
  /** Side length of one Cell, in CSS pixels. */
  readonly cellSize: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface GameLayout {
  readonly board: BoardLayout;
  /** One hit/draw area per Tray slot, left to right. */
  readonly traySlots: readonly Rect[];
  /** Cell size used to draw Pieces resting in the Tray. */
  readonly trayCellSize: number;
}

/** A Piece being dragged: drawn at Board scale with its top-left at (x, y). */
export interface DragView {
  readonly slot: number;
  readonly x: number;
  readonly y: number;
  /** Board origin the Piece would land on if released now (same one the ghost shows). */
  readonly origin: Position;
}

export interface View {
  readonly state: GameState;
  readonly drag: DragView | null;
  /** Core fit query for the dragged Piece at `drag.origin`: ghost Cells + Lines that would Clear. */
  readonly preview: FitResult | null;
  /** Core Tray fit query: a slot whose Piece fits nowhere is drawn dimmed. */
  readonly trayFits: readonly boolean[];
  /** Background + glow colors (Palette Shift, mid-transition). Defaults to the base look. */
  readonly backdrop?: Backdrop;
  /** Clear effects hook (ticket 10): shakes the Board and draws over it, under the Tray and drag. */
  readonly boardOverlay?: BoardOverlay;
}

export interface BoardOverlay {
  /** Board offset, in Cells. */
  readonly shake: { readonly x: number; readonly y: number };
  draw(ctx: CanvasRenderingContext2D, board: BoardLayout): void;
}

const COLORS = {
  boardBackground: "#121a30",
  emptyCell: "#232f52",
  /** Wash over the Lines that would Clear. */
  lineHighlight: "rgba(255, 255, 255, 0.25)",
} as const;

/** Opacity of ghost preview Cells, and of Tray Pieces that fit nowhere. */
const GHOST_ALPHA = 0.4;
const DIMMED_ALPHA = 0.3;
/** Strength of the glow halo behind the Board, and of its rim. */
const GLOW_ALPHA = 0.35;
const GLOW_RIM_ALPHA = 0.8;

/** Block color per core color index (a Skin will replace this in ticket 13). */
const BLOCK_COLORS = [
  "#ff5a5f",
  "#ffb330",
  "#ffe14d",
  "#4cd964",
  "#35c4f0",
  "#5b7cff",
  "#b45bff",
] as const;

/** Largest Piece is 5 Cells long; each Tray slot fits one at Tray scale. */
const TRAY_SCALE = 0.55;
const MAX_PIECE_CELLS = 5;

/** Board centered horizontally in the upper part, Tray of three below it. */
export function layoutGame(width: number, height: number, columns: number): GameLayout {
  const margin = Math.round(width * 0.04);
  const traySideRatio = (MAX_PIECE_CELLS * TRAY_SCALE) / columns + 0.1;
  const side = Math.min(width - margin * 2, (height - margin * 3) / (1 + traySideRatio));
  const cellSize = side / columns;
  const trayHeight = side * traySideRatio;
  const totalHeight = side + margin + trayHeight;
  const x = (width - side) / 2;
  const y = (height - totalHeight) / 2;
  const trayY = y + side + margin;
  const slotW = side / 3;
  return {
    board: { x, y, cellSize },
    traySlots: [0, 1, 2].map((i) => ({ x: x + i * slotW, y: trayY, w: slotW, h: trayHeight })),
    trayCellSize: Math.min(cellSize * TRAY_SCALE, slotW / (MAX_PIECE_CELLS + 0.5)),
  };
}

/** Draws a frame. `width`/`height` are in CSS pixels; the context is already DPR-scaled. */
export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: View,
): void {
  const backdrop = view.backdrop ?? BASE_BACKDROP;
  ctx.fillStyle = backdrop.background;
  ctx.fillRect(0, 0, width, height);

  const { board, tray } = view.state;
  const columns = board[0]?.length ?? 0;
  if (columns === 0) return;
  const layout = layoutGame(width, height, columns);
  const dragged = view.drag ? (tray[view.drag.slot] ?? null) : null;
  const preview = dragged && view.preview?.fits ? view.preview : null;

  // Cells of the Lines that would Clear: their blocks take the dragged Piece's color (as in Block Blast).
  const clearing: Position[] = [];
  if (preview) {
    const inClearedCol = new Set(preview.cols);
    board.forEach((_, r) => {
      for (let c = 0; c < columns; c++) {
        if (preview.rows.includes(r) || inClearedCol.has(c)) clearing.push({ row: r, col: c });
      }
    });
  }
  const overlay = view.boardOverlay;
  ctx.save();
  if (overlay) {
    const { cellSize } = layout.board;
    ctx.translate(overlay.shake.x * cellSize, overlay.shake.y * cellSize);
  }
  drawGlow(ctx, layout.board, columns, backdrop.glow); // the halo shakes with the Board
  const recolor = new Set(clearing.map((p) => p.row * columns + p.col));
  drawBoard(ctx, layout.board, board, (r, c, cell) =>
    cell !== null && dragged && recolor.has(r * columns + c) ? dragged.color : cell,
  );

  if (preview && dragged) {
    const { x, y, cellSize } = layout.board;
    // Ghost: exactly the Cells the Piece would fill. Solid when it completes a Line.
    ctx.globalAlpha = clearing.length > 0 ? 1 : GHOST_ALPHA;
    ctx.fillStyle = blockColor(dragged.color);
    for (const p of preview.cells) drawCell(ctx, x + p.col * cellSize, y + p.row * cellSize, cellSize);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.lineHighlight;
    for (const p of clearing) drawCell(ctx, x + p.col * cellSize, y + p.row * cellSize, cellSize);
  }
  overlay?.draw(ctx, layout.board);
  ctx.restore();

  tray.forEach((entry, slot) => {
    if (!entry || view.drag?.slot === slot) return;
    const at = trayPieceOrigin(layout, slot, entry.piece);
    ctx.globalAlpha = view.trayFits[slot] === false ? DIMMED_ALPHA : 1;
    drawPiece(ctx, entry.piece, entry.color, at.x, at.y, layout.trayCellSize);
  });
  ctx.globalAlpha = 1;

  if (view.drag && dragged) {
    drawPiece(ctx, dragged.piece, dragged.color, view.drag.x, view.drag.y, layout.board.cellSize);
  }
}

/** Top-left of a Tray Piece as drawn at rest, in CSS pixels. */
export function trayPieceOrigin(layout: GameLayout, slot: number, piece: Piece): { x: number; y: number } {
  const rect = layout.traySlots[slot]!;
  const size = layout.trayCellSize;
  return {
    x: rect.x + (rect.w - piece.cols * size) / 2,
    y: rect.y + (rect.h - piece.rows * size) / 2,
  };
}

/** Soft halo of the glow color behind the Board (the Palette Shift's glow). */
function drawGlow(ctx: CanvasRenderingContext2D, layout: BoardLayout, columns: number, glow: string): void {
  const side = layout.cellSize * columns;
  const cx = layout.x + side / 2;
  const cy = layout.y + side / 2;
  const halo = ctx.createRadialGradient(cx, cy, side * 0.3, cx, cy, side * 0.95);
  halo.addColorStop(0, withAlpha(glow, GLOW_ALPHA));
  halo.addColorStop(1, withAlpha(glow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - side, cy - side, side * 2, side * 2);
  // A tighter rim of light hugging the Board frame.
  ctx.save();
  ctx.shadowColor = withAlpha(glow, GLOW_RIM_ALPHA);
  ctx.shadowBlur = layout.cellSize * 0.8;
  ctx.fillStyle = COLORS.boardBackground;
  const pad = Math.max(1, layout.cellSize * 0.06);
  roundRect(ctx, layout.x - pad, layout.y - pad, side + pad * 2, side + pad * 2, layout.cellSize * 0.18);
  ctx.restore();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  board: Board,
  colorAt: (row: number, col: number, cell: Cell) => Cell,
): void {
  const { x, y, cellSize } = layout;
  const side = cellSize * board.length;
  const pad = Math.max(1, cellSize * 0.06);

  ctx.fillStyle = COLORS.boardBackground;
  roundRect(ctx, x - pad, y - pad, side + pad * 2, side + pad * 2, cellSize * 0.18);

  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      const color = colorAt(r, c, cell);
      ctx.fillStyle = color === null ? COLORS.emptyCell : blockColor(color);
      drawCell(ctx, x + c * cellSize, y + r * cellSize, cellSize);
    });
  });
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  color: number,
  x: number,
  y: number,
  cellSize: number,
): void {
  ctx.fillStyle = blockColor(color);
  for (const b of piece.blocks) drawCell(ctx, x + b.col * cellSize, y + b.row * cellSize, cellSize);
}

/** One block or empty Cell whose square starts at (x, y), in the current fill style. */
export function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
  const pad = Math.max(1, cellSize * 0.06);
  roundRect(ctx, x + pad / 2, y + pad / 2, cellSize - pad, cellSize - pad, cellSize * 0.12);
}

export function blockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length]!;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}
