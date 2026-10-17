import { describe, expect, it } from "vitest";
import { attemptPlacement } from "../../core";
import { CLEAR_SHAKE } from "../../feedback/clearCues";
import { directFeedback, type FeedbackCue } from "../../feedback/director";
import { board, run } from "../../testing/core";
import { createClearEffects } from "./clearEffects";
import { EFFECTS as FX } from "./effectsTuning";

// Driven by the director's cues for real core Placements.

/** Places a color-6 dot at `origin` on a Board starting with `rows` (rest empty); returns the director's cues. */
function place(rows: string[], origin: { row: number; col: number }): readonly FeedbackCue[] {
  const filled = [...rows, ...Array.from({ length: 8 - rows.length }, () => "........")];
  const state = run({ board: board(...filled), tray: [{ piece: "dot", color: 6 }, { piece: "dot", color: 6 }, null] });
  const result = attemptPlacement(state, 0, origin);
  if (!result.ok) throw new Error(result.reason);
  return directFeedback(result.events);
}

/** Row 0 cleared by a dot at (0,7) while a block remains at (1,0). */
const oneLine = () => place(["1234560.", "5......."], { row: 0, col: 7 });
/** Row 0 cleared by a dot at (0,7), leaving the Board empty: a Board Clear. */
const boardClear = () => place(["1234560."], { row: 0, col: 7 });

describe("createClearEffects", () => {
  it("does nothing for a Placement without a Clear", () => {
    const fx = createClearEffects(() => 0.5);
    fx.play(place([], { row: 3, col: 3 }), 1000);
    expect(fx.busy(1000)).toBe(false);
    expect(fx.frame(1000).particles).toHaveLength(0);
  });

  it("flashes the cleared Cells in their old colors before they burst", () => {
    const fx = createClearEffects(() => 0.5);
    fx.play(oneLine(), 1000);
    const f = fx.frame(1000);
    expect(f.flash.map((c) => [c.row, c.col, c.color])).toEqual([
      [0, 0, 1], [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 6], [0, 6, 0], [0, 7, 6],
    ]);
    expect(f.particles).toHaveLength(0);
  });

  it("then bursts each cleared block into particles of its color", () => {
    const fx = createClearEffects(() => 0.5);
    fx.play(oneLine(), 1000);
    const f = fx.frame(1000 + FX.flashMs + 1);
    expect(f.flash).toHaveLength(0);
    expect(f.particles).toHaveLength(8 * FX.particles.perBlock);
    const fromCol2 = f.particles.filter((p) => p.color === 3);
    expect(fromCol2).toHaveLength(FX.particles.perBlock);
    for (const p of fromCol2) {
      expect(p.x).toBeGreaterThan(2);
      expect(p.x).toBeLessThan(3.5);
    }
  });

  it("fades particles out and finishes after their lifetime", () => {
    const fx = createClearEffects(() => 0.3);
    fx.play(oneLine(), 0);
    const born = FX.flashMs;
    const early = fx.frame(born + 10).particles[0]!.alpha;
    const late = fx.frame(born + FX.particles.lifeMs * 0.8).particles[0]!.alpha;
    expect(late).toBeLessThan(early);
    const end = born + FX.particles.lifeMs + CLEAR_SHAKE.durationMs + 1;
    expect(fx.frame(end).particles).toHaveLength(0);
    expect(fx.busy(end)).toBe(false);
  });

  it("shakes at the start and settles after the shake duration", () => {
    const fx = createClearEffects(() => 0.9);
    fx.play(oneLine(), 0);
    const s = fx.frame(0).shake;
    expect(Math.hypot(s.x, s.y)).toBeGreaterThan(0);
    expect(fx.frame(CLEAR_SHAKE.durationMs + 1).shake).toEqual({ x: 0, y: 0 });
  });

  it("celebrates a Board Clear with a bigger burst, a longer shake and a full-Board flash", () => {
    const plain = createClearEffects(() => 0.9);
    plain.play(oneLine(), 0);
    const fx = createClearEffects(() => 0.9);
    fx.play(boardClear(), 0);

    expect(plain.frame(0).boardFlash).toBe(0);
    expect(fx.frame(0).boardFlash).toBeGreaterThan(0);
    const t = FX.flashMs + 1;
    expect(fx.frame(t).particles.length).toBeGreaterThan(plain.frame(t).particles.length);
    const afterPlainShake = CLEAR_SHAKE.durationMs + 1;
    expect(plain.frame(afterPlainShake).shake).toEqual({ x: 0, y: 0 });
    const s = fx.frame(afterPlainShake).shake;
    expect(Math.hypot(s.x, s.y)).toBeGreaterThan(0);
  });

  it("keeps earlier effects running when another Clear starts", () => {
    const fx = createClearEffects(() => 0.5);
    fx.play(oneLine(), 0);
    fx.play(oneLine(), FX.flashMs + 50);
    // first burst flying, second one still flashing
    const f = fx.frame(FX.flashMs + 60);
    expect(f.particles).toHaveLength(8 * FX.particles.perBlock);
    expect(f.flash).toHaveLength(8);
  });

  it("never holds more than the particle cap", () => {
    const fx = createClearEffects(() => 0.5);
    for (let i = 0; i < 50; i++) fx.play(boardClear(), 0);
    expect(fx.frame(FX.flashMs + 1).particles.length).toBeLessThanOrEqual(FX.particles.max);
  });

  it("drops everything on reset (a new Run starts on a still Board)", () => {
    const fx = createClearEffects(() => 0.5);
    fx.play(boardClear(), 0);
    fx.frame(FX.flashMs + 1);

    fx.reset();

    expect(fx.busy(FX.flashMs + 2)).toBe(false);
    const f = fx.frame(FX.flashMs + 2);
    expect(f.particles).toHaveLength(0);
    expect(f.flash).toHaveLength(0);
    expect(f.shake).toEqual({ x: 0, y: 0 });
    expect(f.boardFlash).toBe(0);
  });
});
