import { describe, expect, it } from "vitest";
import type { GameEvent } from "../core";
import { directFeedback, type FeedbackCue } from "./director";
import { CLEAR_SHAKE, shakeMagnitude } from "./clearCues";

const placed: GameEvent = {
  type: "piecePlaced",
  slot: 0,
  piece: "dot",
  color: 0,
  origin: { row: 0, col: 7 },
  cells: [{ row: 0, col: 7 }],
  blocks: 1,
  points: 1,
};

const CELLS = [
  { row: 0, col: 6, color: 3 },
  { row: 0, col: 7, color: 0 },
];

/** A Placement that Clears `lines` Lines, lifting the Combo to `combo`, optionally emptying the Board. */
function clear(lines: number, combo: number, boardClear = false): GameEvent[] {
  return [
    placed,
    { type: "linesCleared", rows: [0], cols: [], lines, cells: CELLS, multiplier: combo, points: 10 },
    { type: "comboIncreased", level: combo },
    ...(boardClear ? [{ type: "boardClear", bonus: 300 } as const] : []),
  ];
}

const EFFECT_KINDS: readonly FeedbackCue["kind"][] = ["burst", "shake", "boardFlash"];
const effectCues = (events: GameEvent[]) =>
  directFeedback(events).filter((c) => EFFECT_KINDS.includes(c.kind));

const shakeOf = (events: GameEvent[]) => {
  const cue = effectCues(events).find((c) => c.kind === "shake");
  return cue?.kind === "shake" ? cue.magnitude : 0;
};

describe("Clear effect cues", () => {
  it("are absent for a Placement without a Clear", () => {
    expect(effectCues([placed])).toEqual([]);
  });

  it("burst the cleared Cells (in their old colors) and shake the Board on a Clear", () => {
    const cues = effectCues(clear(1, 1));

    expect(cues.map((c) => c.kind)).toEqual(["burst", "shake"]);
    expect(cues[0]).toEqual({ kind: "burst", cells: CELLS, big: false });
    expect(cues[1]).toMatchObject({ kind: "shake", durationMs: CLEAR_SHAKE.durationMs });
  });

  it("shake harder for a bigger Multi-Clear and a higher Combo", () => {
    expect(shakeOf(clear(2, 1))).toBeGreaterThan(shakeOf(clear(1, 1)));
    expect(shakeOf(clear(1, 3))).toBeGreaterThan(shakeOf(clear(1, 1)));
  });

  it("celebrate a Board Clear with a big burst, a longer, harder shake and a full-Board flash", () => {
    const cues = effectCues(clear(1, 1, true));

    expect(cues.map((c) => c.kind)).toEqual(["burst", "shake", "boardFlash"]);
    expect(cues[0]).toMatchObject({ big: true });
    expect(cues[1]).toMatchObject({ durationMs: CLEAR_SHAKE.boardClearDurationMs });
    expect(shakeOf(clear(1, 1, true))).toBeGreaterThan(shakeOf(clear(12, 30)));
  });
});

describe("shakeMagnitude", () => {
  const shake = (lines: number, combo = 1, boardClear = false) =>
    shakeMagnitude({ lines, combo, boardClear });

  it("grows with the size of the Multi-Clear", () => {
    expect(shake(1)).toBeGreaterThan(0);
    expect(shake(2)).toBeGreaterThan(shake(1));
    expect(shake(3)).toBeGreaterThan(shake(2));
  });

  it("grows with the Combo level", () => {
    expect(shake(1, 2)).toBeGreaterThan(shake(1, 1));
    expect(shake(1, 5)).toBeGreaterThan(shake(1, 2));
  });

  it("is capped for ordinary Clears", () => {
    expect(shake(12, 30)).toBe(CLEAR_SHAKE.max);
  });

  it("a Board Clear shakes harder than any ordinary Clear", () => {
    expect(shake(1, 1, true)).toBeGreaterThan(shake(12, 30));
  });

  it("follows the shake table (3 Lines at Combo 2 = 0.08 + 2 × 0.07 + 0.03 Cells)", () => {
    expect(shake(3, 2)).toBeCloseTo(0.25);
  });
});
