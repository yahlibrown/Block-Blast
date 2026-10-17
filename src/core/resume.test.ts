import { describe, expect, it } from "vitest";
import {
  attemptPlacement,
  BOARD_SIZE,
  create,
  restore,
  serialize,
  TRAY_SIZE,
  type GameState,
} from "./index";

/** Place Pieces greedily (first slot, first origin that fits) `count` times. */
function play(state: GameState, count: number): GameState {
  for (let n = 0; n < count; n++) {
    state = placeFirstFit(state);
  }
  return state;
}

function placeFirstFit(state: GameState): GameState {
  for (let slot = 0; slot < TRAY_SIZE; slot++) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const result = attemptPlacement(state, slot, { row, col });
        if (result.ok) return result.state;
      }
    }
  }
  throw new Error("ran out of Placements");
}

/** A JSON trip, as storage does it. */
function throughStorage(state: GameState): GameState {
  return restore(JSON.parse(JSON.stringify(serialize(state))));
}

describe("resuming a Run", () => {
  it("restores a mid-Run state with its Board, Tray, score, Combo and dry count", () => {
    const board = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (r === 7 && c < 6 ? 2 : null)),
    );
    const original = restore({
      version: 1,
      board,
      tray: [{ piece: "h2", color: 5 }, null, { piece: "sq2", color: 1 }],
      rng: 12345,
      score: 420,
      best: 900,
      runStartBest: 700,
      combo: 3,
      dry: 2,
    });

    const resumed = throughStorage(original);

    expect(serialize(resumed)).toEqual({
      version: 1,
      board,
      tray: [{ piece: "h2", color: 5 }, null, { piece: "sq2", color: 1 }],
      rng: 12345,
      score: 420,
      best: 900,
      runStartBest: 700,
      combo: 3,
      dry: 2,
      over: false,
      paletteLevel: 0,
      lifetime: 0,
      unlocked: ["classic"],
      runUnlocked: [],
    });
  });

  it("deals the same next Tray as the original Run would have", () => {
    // Two Placements in: the third empties the Tray and triggers a deal.
    const midRun = play(create({ seed: 2024 }), 2);
    const resumed = throughStorage(midRun);

    const original = placeFirstFit(midRun);
    const afterResume = placeFirstFit(resumed);

    expect(serialize(original).tray.every((t) => t !== null)).toBe(true);
    expect(serialize(afterResume)).toEqual(serialize(original));
  });

  it("keeps a finished Run over", () => {
    const over = restore({
      version: 1,
      board: serialize(create({ seed: 1 })).board,
      tray: [null, null, null],
      over: true,
    });

    expect(throughStorage(over).over).toBe(true);
  });
});
