// Canvas 2D renderer. Draws game state; holds no game rules.
import type { Board } from "../core";

export interface BoardLayout {
  /** Top-left of the Board, in CSS pixels. */
  readonly x: number;
  readonly y: number;
  /** Side length of one Cell, in CSS pixels. */
  readonly cellSize: number;
}

const COLORS = {
  background: "#1b2440",
  boardBackground: "#121a30",
  emptyCell: "#232f52",
} as const;

/** Board fills the width minus a side margin, centered vertically. */
export function layoutBoard(width: number, height: number, columns: number): BoardLayout {
  const margin = Math.round(width * 0.04);
  const side = Math.min(width - margin * 2, height - margin * 2);
  const cellSize = side / columns;
  return {
    x: (width - side) / 2,
    y: (height - side) / 2,
    cellSize,
  };
}

/** Draws a frame. `width`/`height` are in CSS pixels; the context is already DPR-scaled. */
export function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  board: Board,
): void {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const columns = board[0]?.length ?? 0;
  if (columns === 0) return;
  const { x, y, cellSize } = layoutBoard(width, height, columns);
  const side = cellSize * columns;
  const pad = Math.max(1, cellSize * 0.06);

  ctx.fillStyle = COLORS.boardBackground;
  roundRect(ctx, x - pad, y - pad, side + pad * 2, side + pad * 2, cellSize * 0.18);

  board.forEach((row, r) => {
    row.forEach((_cell, c) => {
      // Filled Cells are drawn once Placement exists (ticket 03).
      ctx.fillStyle = COLORS.emptyCell;
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
