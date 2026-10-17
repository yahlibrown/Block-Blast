import { describe, expect, it } from "vitest";
import {
  create,
  restore,
  serialize,
} from "./index";
import { board, run, DOTS, place, withTray } from "../testing/core";

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

  it("keeps growing faster than the number of Lines, past the end of the tuned table", () => {
    const FULL_BUT_LAST = "1111111.";
    /** The ×1 Clear from dropping a vertical Piece into column 7, just below the `top` rows, onto full-but-one rows. */
    const observed = (piece: "v3" | "v4" | "v5", top: string[]) => {
      const rows = [...top, ...Array.from({ length: 8 - top.length }, () => FULL_BUT_LAST)];
      const state = run({ board: board(...rows), tray: [{ piece, color: 2 }, null, null] });
      const cleared = place(state, 0, top.length, 7).events.find((e) => e.type === "linesCleared");
      if (cleared?.type !== "linesCleared" || cleared.multiplier !== 1) throw new Error("expected a ×1 Clear");
      return { lines: cleared.lines, points: cleared.points };
    };
    const results = [
      observed("v3", ["1.......", "........", "........", "........", "........"]),
      observed("v4", ["1.......", "........", "........", "........"]),
      observed("v5", ["1.......", "........", "........"]),
      // column 7 completes too
      observed("v5", ["1......1", ".......1", ".......1"]),
      // columns 0 and 7 complete too: beyond the 6-entry table
      observed("v5", ["1......1", "1......1", "1......1"]),
    ];

    expect(results.map((r) => r.lines)).toEqual([3, 4, 5, 6, 7]);
    const points = results.map((r) => r.points);
    expect(points.slice(0, 4)).toEqual([60, 100, 150, 210]);
    const steps = points.slice(1).map((p, i) => p - points[i]!);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]!);
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
    expect(serialize(create({ seed: 1, profile: { best: 70 } }))).toMatchObject({
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
