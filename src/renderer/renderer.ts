// Canvas 2D renderer. Draws game state; holds no game rules.
import type { Board, GameState, Piece } from "../core";

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
}

export interface View {
  readonly state: GameState;
  readonly drag: DragView | null;
}

const COLORS = {
  background: "#1b2440",
  boardBackground: "#121a30",
  emptyCell: "#232f52",
} as const;

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
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const { board, tray } = view.state;
  const columns = board[0]?.length ?? 0;
  if (columns === 0) return;
  const layout = layoutGame(width, height, columns);
  drawBoard(ctx, layout.board, board);

  tray.forEach((entry, slot) => {
    if (!entry || view.drag?.slot === slot) return;
    const at = trayPieceOrigin(layout, slot, entry.piece);
    drawPiece(ctx, entry.piece, entry.color, at.x, at.y, layout.trayCellSize);
  });

  if (view.drag) {
    const entry = tray[view.drag.slot];
    if (entry) {
      drawPiece(ctx, entry.piece, entry.color, view.drag.x, view.drag.y, layout.board.cellSize);
    }
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

function drawBoard(ctx: CanvasRenderingContext2D, layout: BoardLayout, board: Board): void {
  const { x, y, cellSize } = layout;
  const side = cellSize * board.length;
  const pad = Math.max(1, cellSize * 0.06);

  ctx.fillStyle = COLORS.boardBackground;
  roundRect(ctx, x - pad, y - pad, side + pad * 2, side + pad * 2, cellSize * 0.18);

  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      ctx.fillStyle = cell === null ? COLORS.emptyCell : blockColor(cell);
      roundRect(
        ctx,
        x + c * cellSize + pad / 2,
        y + r * cellSize + pad / 2,
        cellSize - pad,
        cellSize - pad,
        cellSize * 0.12,
      );
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
  const pad = Math.max(1, cellSize * 0.06);
  ctx.fillStyle = blockColor(color);
  for (const b of piece.blocks) {
    roundRect(
      ctx,
      x + b.col * cellSize + pad / 2,
      y + b.row * cellSize + pad / 2,
      cellSize - pad,
      cellSize - pad,
      cellSize * 0.12,
    );
  }
}

function blockColor(index: number): string {
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
