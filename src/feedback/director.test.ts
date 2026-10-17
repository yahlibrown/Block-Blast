import { describe, expect, it } from "vitest";
import type { GameEvent } from "../core";
import { directFeedback } from "./director";

const placed: GameEvent = {
  type: "piecePlaced",
  slot: 0,
  piece: "dot",
  color: 0,
  origin: { row: 0, col: 0 },
  cells: [{ row: 0, col: 0 }],
  blocks: 1,
  points: 1,
};

/** The events of a Placement that Clears `lines` Lines and lifts the Combo to `combo`. */
function clear(lines: number, combo: number): GameEvent[] {
  return [
    placed,
    { type: "linesCleared", rows: [], cols: [], lines, cells: [], multiplier: combo, points: 0 },
    { type: "comboIncreased", level: combo },
  ];
}

const praise = (events: GameEvent[]) =>
  directFeedback(events)
    .filter((c) => c.kind === "praise")
    .map((c) => c.text);

describe("Praise", () => {
  it("is silent for a Placement without a Clear", () => {
    expect(directFeedback([placed])).toEqual([]);
  });

  it("says Good! for a single Line at the start of a Combo", () => {
    expect(praise(clear(1, 1))).toEqual(["Good!"]);
  });

  it.each([
    [2, "Great!"],
    [3, "Excellent!"],
    [4, "Amazing!"],
    [5, "Unbelievable!"],
    [7, "Unbelievable!"],
  ])("escalates with the Multi-Clear size: %i Lines → %s", (lines, text) => {
    expect(praise(clear(lines, 1))).toEqual([text]);
  });

  it.each([
    [2, "Good!"],
    [3, "Great!"],
    [5, "Excellent!"],
    [7, "Amazing!"],
    [10, "Unbelievable!"],
  ])("escalates with the Combo level: a single Line at Combo %i → %s", (combo, text) => {
    expect(praise(clear(1, combo))).toEqual([text]);
  });

  it("follows whichever of Multi-Clear size and Combo level is more impressive", () => {
    expect(praise(clear(2, 7))).toEqual(["Amazing!"]);
    expect(praise(clear(4, 3))).toEqual(["Amazing!"]);
  });

  it("reports how strong it is, from 0 (Good!) to 4 (Unbelievable!)", () => {
    expect(directFeedback(clear(1, 1))).toContainEqual({ kind: "praise", text: "Good!", tier: 0 });
    expect(directFeedback(clear(5, 1))).toContainEqual({
      kind: "praise",
      text: "Unbelievable!",
      tier: 4,
    });
  });
});

describe("the Combo display", () => {
  it("does not show a ×1 Combo", () => {
    expect(directFeedback(clear(1, 1)).filter((c) => c.kind === "combo")).toEqual([]);
  });

  it("shows COMBO ×N when the Combo grows to 2 or more", () => {
    expect(directFeedback(clear(1, 4))).toContainEqual({ kind: "combo", level: 4 });
  });

  it("ends when a shown Combo breaks", () => {
    expect(directFeedback([placed, { type: "comboBroken", level: 3 }])).toEqual([
      { kind: "comboEnd", level: 3 },
    ]);
  });

  it("stays quiet when a Combo too small to have been shown breaks", () => {
    expect(directFeedback([placed, { type: "comboBroken", level: 1 }])).toEqual([]);
  });
});

describe("NEW BEST", () => {
  it("bursts when the core reports the Best Score beaten", () => {
    expect(directFeedback([placed, { type: "newBest", score: 120, previous: 100 }])).toEqual([
      { kind: "newBest", score: 120 },
    ]);
  });
});

it("gives cues in the order of the events behind them", () => {
  const cues = directFeedback([...clear(2, 3), { type: "newBest", score: 50, previous: 40 }]);

  expect(cues.map((c) => c.kind)).toEqual(["praise", "combo", "newBest"]);
});
