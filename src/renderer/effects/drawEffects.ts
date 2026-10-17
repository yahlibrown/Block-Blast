// Draws one `EffectsFrame` over the Board (Canvas 2D). No simulation here: see clearEffects.ts.
import type { Board } from "../../core";
import { blockColor, drawCell, type BoardLayout, type BoardOverlay } from "../renderer";
import type { EffectsFrame } from "./clearEffects";

/** Peak opacity of the white wash on flashing Lines and of the Board Clear flash. */
const FLASH_WASH_ALPHA = 0.85;
const BOARD_FLASH_ALPHA = 0.7;

/** Wraps a frame as the renderer's Board overlay hook. */
export function effectsOverlay(frame: EffectsFrame, board: Board): BoardOverlay {
  return { shake: frame.shake, draw: (ctx, layout) => drawEffects(ctx, layout, frame, board) };
}

function drawEffects(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  frame: EffectsFrame,
  board: Board,
): void {
  const { x, y, cellSize } = layout;

  // Flash: the cleared blocks, still in their old colors, washing to white before they burst.
  // Skip a Cell the player has already refilled (input is never blocked by effects).
  for (const c of frame.flash) {
    if (board[c.row]?.[c.col] !== null) continue;
    const cx = x + c.col * cellSize;
    const cy = y + c.row * cellSize;
    ctx.fillStyle = blockColor(c.color);
    drawCell(ctx, cx, cy, cellSize);
    ctx.globalAlpha = FLASH_WASH_ALPHA * frame.flashStrength;
    ctx.fillStyle = "#ffffff";
    drawCell(ctx, cx, cy, cellSize);
    ctx.globalAlpha = 1;
  }

  // Particles: plain squares (fillRect is the cheapest Canvas 2D primitive on a phone).
  for (const p of frame.particles) {
    const size = p.size * cellSize;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = blockColor(p.color);
    ctx.fillRect(x + p.x * cellSize - size / 2, y + p.y * cellSize - size / 2, size, size);
  }
  ctx.globalAlpha = 1;

  if (frame.boardFlash > 0) {
    const side = cellSize * board.length;
    ctx.globalAlpha = BOARD_FLASH_ALPHA * frame.boardFlash;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, side, side);
    ctx.globalAlpha = 1;
  }
}
