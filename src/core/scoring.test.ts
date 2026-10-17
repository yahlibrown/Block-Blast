import { describe, expect, it } from "vitest";
import {
  attemptPlacement,
  clearPoints,
  create,
  restore,
  serialize,
  type GameState,
  type SaveData,
} from "./index";

/** Board from art: `.` empty, a digit = filled with that color. 8 rows of 8. */
function board(...rows: string[]): (number | null)[][] {
  return rows.map((row) => [...row].map((ch) => (ch === "." ? null : Number(ch))));
}

const EMPTY = board(...Array.from({ length: 8 }, () => "........"));

function run(data: Partial<SaveData>): GameState {
  return restore({ version: 1, board: EMPTY, tray: [null, null, null], ...data });
}

function place(state: GameState, slot: number, row: number, col: number) {
  const result = attemptPlacement(state, slot, { row, col });
  if (!result.ok) throw new Error(`expected Placement to succeed, got ${result.reason}`);
  return result;
}

/** Same Run, with a new Tray (so a scenario can keep placing). */
function withTray(state: GameState, tray: SaveData["tray"]): GameState {
  return restore({ ...serialize(state), tray });
}

const DOTS: SaveData["tray"] = [
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
];

/** One dot (at row 7, col 7) away from clearing row 7; the stray block stops a Board Clear. */
const ONE_LINE_READY = board(
  "1.......",
  "........",
  "........",
  "........",
  "........",
  "........",
  "........",
  "1111111.",
);

describe("block points", () => {
  it("scores +1 per block placed", () => {
    const state = run({ tray: [{ piece: "sq2", color: 0 }, { piece: "dot", color: 0 }, null] });

    const result = place(state, 0, 0, 0);

    expect(serialize(result.state).score).toBe(4);
    expect(result.events[0]).toMatchObject({ type: "piecePlaced", blocks: 4, points: 4 });
  });

  it("adds to the score already earned in the Run", () => {
    const state = run({
      score: 120,
      tray: [{ piece: "h3", color: 0 }, { piece: "dot", color: 0 }, null],
    });

    expect(serialize(place(state, 0, 0, 0).state).score).toBe(123);
  });
});

describe("Clear points", () => {
  it.each([
    [1, "dot", 1 + 10],
    [2, "v2", 2 + 30],
    [3, "v3", 3 + 60],
    [4, "v4", 4 + 100],
  ] as const)("clearing %i Line(s) at once scores its tuned points", (lines, piece, total) => {
    const rows = Array.from({ length: 8 }, (_, r) =>
      r === 0 ? "1......." : r >= 8 - lines ? "1111111." : "........",
    );
    const state = run({ board: board(...rows), tray: [{ piece, color: 2 }, null, null] });

    const result = place(state, 0, 8 - lines, 7);

    expect(result.events[1]).toMatchObject({
      type: "linesCleared",
      lines,
      multiplier: 1,
      points: total - lines,
    });
    expect(serialize(result.state).score).toBe(total);
  });

  it("keeps growing faster than the number of Lines beyond 4", () => {
    for (const lines of [5, 6, 7]) {
      const step = clearPoints(lines) - clearPoints(lines - 1);
      const previousStep = clearPoints(lines - 1) - clearPoints(lines - 2);
      expect(step).toBeGreaterThan(previousStep);
    }
  });
});

describe("the Combo", () => {
  it("starts at 0, so the first Clear is ×1 and raises it to 1", () => {
    const result = place(run({ board: ONE_LINE_READY, tray: DOTS }), 0, 7, 7);

    expect(result.events).toContainEqual({ type: "comboIncreased", level: 1 });
    expect(result.events[1]).toMatchObject({ multiplier: 1, points: 10 });
    expect(serialize(result.state).combo).toBe(1);
  });

  it("multiplies later Clears by the level after this Clear's increment", () => {
    const state = run({ board: ONE_LINE_READY, tray: DOTS, combo: 2 });

    const result = place(state, 0, 7, 7);

    expect(result.events).toContainEqual({ type: "comboIncreased", level: 3 });
    expect(result.events[1]).toMatchObject({ multiplier: 3, points: 30 });
    expect(serialize(result.state).score).toBe(1 + 30);
  });

  it("survives two Placements without a Clear", () => {
    let state = run({ board: ONE_LINE_READY, tray: DOTS, combo: 2 });
    state = place(state, 0, 3, 3).state;
    state = place(state, 1, 3, 4).state;
    expect(serialize(state).combo).toBe(2);

    const clear = place(state, 2, 7, 7);

    expect(clear.events[1]).toMatchObject({ multiplier: 3, points: 30 });
  });

  it("breaks on the third Placement in a row without a Clear", () => {
    const dry1 = place(run({ board: ONE_LINE_READY, tray: DOTS, combo: 4 }), 0, 3, 3);
    const dry2 = place(dry1.state, 1, 3, 4);
    const dry3 = place(dry2.state, 2, 3, 5);

    expect(dry1.events.map((e) => e.type)).not.toContain("comboBroken");
    expect(dry2.events.map((e) => e.type)).not.toContain("comboBroken");
    expect(dry3.events).toContainEqual({ type: "comboBroken", level: 4 });
    expect(serialize(dry3.state).combo).toBe(0);

    const clear = place(withTray(dry3.state, DOTS), 0, 7, 7);
    expect(clear.events[1]).toMatchObject({ multiplier: 1, points: 10 });
  });

  it("reports no break when there is no Combo to lose", () => {
    let state = run({ tray: DOTS });
    state = place(state, 0, 0, 0).state;
    state = place(state, 1, 0, 2).state;
    const third = place(state, 2, 0, 4);

    expect(third.events.map((e) => e.type)).not.toContain("comboBroken");
  });

  it("resets the dry count on a Clear", () => {
    // Two dry Placements already: one more would break the Combo, but this one Clears.
    let state = run({ board: ONE_LINE_READY, tray: DOTS, combo: 1, dry: 2 });
    state = place(state, 0, 7, 7).state;
    expect(serialize(state)).toMatchObject({ combo: 2, dry: 0 });

    const dry1 = place(state, 1, 3, 3);
    const dry2 = place(dry1.state, 2, 3, 4);

    expect([...dry1.events, ...dry2.events].map((e) => e.type)).not.toContain("comboBroken");
    expect(serialize(dry2.state).combo).toBe(2);
  });
});

describe("a Board Clear", () => {
  it("adds a flat bonus when a Clear leaves the Board empty", () => {
    const state = run({
      board: board(
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "1111111.",
      ),
      tray: DOTS,
    });

    const result = place(state, 0, 7, 7);

    expect(result.events.map((e) => e.type)).toEqual([
      "piecePlaced",
      "linesCleared",
      "comboIncreased",
      "boardClear",
    ]);
    expect(result.events[3]).toEqual({ type: "boardClear", bonus: 300 });
    expect(serialize(result.state).score).toBe(1 + 10 + 300);
  });

  it("is not awarded while any block remains", () => {
    const result = place(run({ board: ONE_LINE_READY, tray: DOTS }), 0, 7, 7);

    expect(result.events.map((e) => e.type)).not.toContain("boardClear");
  });
});

describe("the Best Score", () => {
  it("rises with the score once the score beats it", () => {
    const state = run({
      score: 48,
      best: 50,
      tray: [{ piece: "sq2", color: 0 }, null, null],
    });

    expect(serialize(place(state, 0, 0, 0).state)).toMatchObject({ score: 52, best: 52 });
  });

  it("stays put while the score is below it", () => {
    const state = run({ score: 10, best: 50, tray: DOTS });

    expect(serialize(place(state, 0, 0, 0).state)).toMatchObject({ score: 11, best: 50 });
  });

  it("is carried into a new Run, which starts at score 0 with no Combo", () => {
    expect(serialize(create({ seed: 1, best: 70 }))).toMatchObject({
      score: 0,
      best: 70,
      combo: 0,
      dry: 0,
    });
  });
});

describe("saving the scoring state", () => {
  it("round-trips score, Best Score, Combo and dry count", () => {
    const state = run({ board: ONE_LINE_READY, tray: DOTS, score: 7, best: 99, combo: 3, dry: 1 });

    expect(serialize(restore(serialize(state)))).toMatchObject({
      score: 7,
      best: 99,
      combo: 3,
      dry: 1,
    });
  });

  it("rejects a negative or fractional score", () => {
    expect(() => run({ score: -1 })).toThrow();
    expect(() => run({ combo: 1.5 })).toThrow();
  });
});
