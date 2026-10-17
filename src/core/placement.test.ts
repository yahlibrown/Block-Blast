import { describe, expect, it } from "vitest";
import { attemptPlacement, queryFit, restore, serialize, trayFits, type SaveData } from "./index";

/** Board from art: `.` empty, a digit = filled with that color. 8 rows of 8. */
function board(...rows: string[]): (number | null)[][] {
  return rows.map((row) => [...row].map((ch) => (ch === "." ? null : Number(ch))));
}

const EMPTY = board(...Array.from({ length: 8 }, () => "........"));

function run(data: Partial<SaveData>): ReturnType<typeof restore> {
  return restore({ version: 1, board: EMPTY, tray: [null, null, null], ...data });
}

describe("a valid Placement", () => {
  it("fills the Piece's Cells with its color and empties its Tray slot", () => {
    const state = run({
      tray: [{ piece: "sq2", color: 3 }, { piece: "dot", color: 1 }, null],
    });

    const result = attemptPlacement(state, 0, { row: 2, col: 5 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(serialize(result.state).board).toEqual(
      board(
        "........",
        "........",
        ".....33.",
        ".....33.",
        "........",
        "........",
        "........",
        "........",
      ),
    );
    expect(serialize(result.state).tray).toEqual([null, { piece: "dot", color: 1 }, null]);
  });

  it("reports the Piece placed", () => {
    const state = run({ tray: [{ piece: "h2", color: 4 }, { piece: "dot", color: 0 }, null] });

    const result = attemptPlacement(state, 0, { row: 0, col: 6 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(result.events).toEqual([
      {
        type: "piecePlaced",
        slot: 0,
        piece: "h2",
        color: 4,
        origin: { row: 0, col: 6 },
        cells: [
          { row: 0, col: 6 },
          { row: 0, col: 7 },
        ],
        blocks: 2,
      },
    ]);
  });
});

describe("a rejected Placement", () => {
  const state = run({
    board: board(
      "........",
      "...1....",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
    ),
    tray: [{ piece: "sq2", color: 3 }, null, { piece: "h3", color: 2 }],
  });

  it("is refused when the Piece overlaps a filled Cell", () => {
    expect(attemptPlacement(state, 0, { row: 0, col: 2 })).toEqual({ ok: false, reason: "overlap" });
  });

  it("is refused when any block would land off the Board", () => {
    expect(attemptPlacement(state, 2, { row: 0, col: 6 })).toEqual({
      ok: false,
      reason: "out-of-bounds",
    });
    expect(attemptPlacement(state, 0, { row: 7, col: 0 })).toEqual({
      ok: false,
      reason: "out-of-bounds",
    });
    expect(attemptPlacement(state, 0, { row: -1, col: 0 })).toEqual({
      ok: false,
      reason: "out-of-bounds",
    });
  });

  it("is refused for an empty Tray slot", () => {
    expect(attemptPlacement(state, 1, { row: 4, col: 4 })).toEqual({
      ok: false,
      reason: "empty-slot",
    });
    expect(attemptPlacement(state, 3, { row: 4, col: 4 })).toEqual({
      ok: false,
      reason: "empty-slot",
    });
  });

  it("leaves the state untouched", () => {
    const before = serialize(state);
    attemptPlacement(state, 0, { row: 0, col: 2 });
    attemptPlacement(state, 2, { row: 4, col: 0 });
    expect(serialize(state)).toEqual(before);
  });
});

describe("Clearing Lines", () => {
  it("Clears a completed row", () => {
    const state = run({
      board: board(
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "1111.111",
        "2.......",
      ),
      tray: [{ piece: "v2", color: 5 }, { piece: "dot", color: 0 }, null],
    });

    const result = attemptPlacement(state, 0, { row: 5, col: 4 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(serialize(result.state).board).toEqual(
      board(
        "........",
        "........",
        "........",
        "........",
        "........",
        "....5...",
        "........",
        "2.......",
      ),
    );
    expect(result.events.map((e) => e.type)).toEqual(["piecePlaced", "linesCleared"]);
    expect(result.events[1]).toMatchObject({ type: "linesCleared", rows: [6], cols: [], lines: 1 });
  });

  it("Clears a row and a column sharing a Cell together", () => {
    const state = run({
      board: board(
        "..3.....",
        "..3.....",
        "..3.....",
        "11.11111",
        "..3.....",
        "..3.....",
        "..3.....",
        "..3.....",
      ),
      tray: [{ piece: "dot", color: 6 }, { piece: "dot", color: 0 }, null],
    });

    const result = attemptPlacement(state, 0, { row: 3, col: 2 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(serialize(result.state).board).toEqual(EMPTY);
    const cleared = result.events[1];
    expect(cleared).toMatchObject({ type: "linesCleared", rows: [3], cols: [2], lines: 2 });
    if (cleared?.type !== "linesCleared") return;
    expect(cleared.cells).toHaveLength(15);
    expect(cleared.cells).toContainEqual({ row: 3, col: 2, color: 6 });
    expect(cleared.cells).toContainEqual({ row: 0, col: 2, color: 3 });
    expect(cleared.cells).toContainEqual({ row: 3, col: 0, color: 1 });
  });

  it("Clears every Line completed at once", () => {
    const state = run({
      board: board(
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "11111...",
        "11111...",
      ),
      tray: [{ piece: "rect2x3", color: 2 }, { piece: "dot", color: 0 }, null],
    });

    const result = attemptPlacement(state, 0, { row: 6, col: 5 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(serialize(result.state).board).toEqual(EMPTY);
    expect(result.events[1]).toMatchObject({ rows: [6, 7], cols: [], lines: 2 });
  });
});

describe("dealing a new Tray", () => {
  it("happens only once all three Pieces are placed", () => {
    let state = run({
      tray: [
        { piece: "dot", color: 0 },
        { piece: "dot", color: 1 },
        { piece: "dot", color: 2 },
      ],
      rng: 42,
    });

    const first = attemptPlacement(state, 1, { row: 0, col: 0 });
    if (!first.ok) throw new Error("expected Placement to succeed");
    expect(first.events.map((e) => e.type)).toEqual(["piecePlaced"]);
    state = first.state;

    const second = attemptPlacement(state, 0, { row: 7, col: 7 });
    if (!second.ok) throw new Error("expected Placement to succeed");
    expect(second.events.map((e) => e.type)).toEqual(["piecePlaced"]);
    expect(serialize(second.state).tray).toEqual([null, null, { piece: "dot", color: 2 }]);
    state = second.state;

    const third = attemptPlacement(state, 2, { row: 4, col: 4 });
    if (!third.ok) throw new Error("expected Placement to succeed");
    expect(third.events.map((e) => e.type)).toEqual(["piecePlaced", "trayDealt"]);
    expect(third.state.tray.every((slot) => slot !== null)).toBe(true);
    expect(third.events[1]).toEqual({ type: "trayDealt", tray: third.state.tray });
  });

  it("comes after the Clear", () => {
    const state = run({
      board: board(
        "1111111.",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
      ),
      tray: [null, { piece: "dot", color: 4 }, null],
    });

    const result = attemptPlacement(state, 1, { row: 0, col: 7 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(result.events.map((e) => e.type)).toEqual([
      "piecePlaced",
      "linesCleared",
      "trayDealt",
    ]);
  });
});

describe("the fit query", () => {
  const state = run({
    board: board(
      "111111..",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
    ),
    tray: [{ piece: "h2", color: 1 }, null, { piece: "sq3", color: 2 }],
  });

  it("reports a fit and the Lines that would Clear, without changing state", () => {
    const before = serialize(state);

    expect(queryFit(state, 0, { row: 0, col: 6 })).toEqual({
      fits: true,
      cells: [
        { row: 0, col: 6 },
        { row: 0, col: 7 },
      ],
      rows: [0],
      cols: [],
    });
    expect(queryFit(state, 0, { row: 3, col: 3 })).toMatchObject({ fits: true, rows: [], cols: [] });
    expect(serialize(state)).toEqual(before);
  });

  it("reports why a Piece doesn't fit", () => {
    expect(queryFit(state, 0, { row: 0, col: 5 })).toEqual({ fits: false, reason: "overlap" });
    expect(queryFit(state, 0, { row: 0, col: 7 })).toEqual({
      fits: false,
      reason: "out-of-bounds",
    });
    expect(queryFit(state, 1, { row: 3, col: 3 })).toEqual({ fits: false, reason: "empty-slot" });
  });
});

describe("the Tray fit query", () => {
  it("reports which Tray Pieces fit anywhere on the Board", () => {
    const state = run({
      board: board(
        "11.11.11",
        "11111111",
        "11.11.11",
        "11111111",
        "11.11.11",
        "11111111",
        "11.11.11",
        "11111111",
      ),
      tray: [{ piece: "dot", color: 0 }, { piece: "h2", color: 0 }, null],
    });

    expect(trayFits(state)).toEqual([true, false, false]);
  });
});
