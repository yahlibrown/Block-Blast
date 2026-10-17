import { describe, expect, it, vi } from "vitest";
import { attemptPlacement, create, restore, serialize, type GameState, type SaveData } from "./index";
import * as core from "./index";

type Cell = number | null;
const EMPTY: Cell[][] = Array.from({ length: 8 }, () => Array.from({ length: 8 }, (): Cell => null));

const DOTS: SaveData["tray"] = [
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
];

function run(data: Partial<SaveData>): GameState {
  return restore({ version: 1, board: EMPTY, tray: DOTS, ...data });
}

function place(state: GameState, slot: number, row: number, col: number) {
  const result = attemptPlacement(state, slot, { row, col });
  if (!result.ok) throw new Error(`expected Placement to succeed, got ${result.reason}`);
  return result;
}

const shifts = (events: readonly core.GameEvent[]) => events.filter((e) => e.type === "paletteShift");

describe("Palette Shifts", () => {
  it("shifts to level 1 when the score crosses 1,000 points", () => {
    const result = place(run({ score: 999 }), 0, 0, 0);

    expect(shifts(result.events)).toEqual([{ type: "paletteShift", level: 1 }]);
    expect(serialize(result.state).paletteLevel).toBe(1);
  });

  it("emits one shift to the final level when one Placement crosses two thresholds", () => {
    // Rows 6 and 7 one v2 short of a Clear; a stray block stops a Board Clear.
    const board = EMPTY.map((row) => [...row]);
    board[0]![0] = 1;
    for (let col = 0; col < 7; col++) board[6]![col] = board[7]![col] = 1;
    // Combo 40 → ×41 multiplier: 2 blocks + 30 × 41 = 1,232 points, 990 → 2,222.
    const state = run({ board, score: 990, combo: 40, tray: [{ piece: "v2", color: 0 }, null, null] });

    const result = place(state, 0, 6, 7);

    expect(serialize(result.state).score).toBe(2222);
    expect(shifts(result.events)).toEqual([{ type: "paletteShift", level: 2 }]);
    expect(serialize(result.state).paletteLevel).toBe(2);
  });

  it("doesn't shift below the first threshold", () => {
    const result = place(run({ score: 998 }), 0, 0, 0);

    expect(shifts(result.events)).toEqual([]);
    expect(serialize(result.state).paletteLevel).toBe(0);
  });

  it("doesn't shift again while the score stays within the same level", () => {
    const result = place(run({ score: 1500, paletteLevel: 1 }), 0, 0, 0);

    expect(shifts(result.events)).toEqual([]);
    expect(serialize(result.state).paletteLevel).toBe(1);
  });

  it("comes after a Board Clear and before the Tray is dealt", () => {
    const board = EMPTY.map((row) => [...row]);
    for (let col = 0; col < 7; col++) board[7]![col] = 1;
    // 1 + 10 + 300 Board Clear bonus: 700 → 1,011, and it was the last Tray Piece.
    const result = place(run({ board, score: 700, tray: [{ piece: "dot", color: 0 }, null, null] }), 0, 7, 7);

    const types = result.events.map((e) => e.type);
    expect(types).toEqual([
      "piecePlaced",
      "linesCleared",
      "comboIncreased",
      "boardClear",
      "paletteShift",
      "trayDealt",
    ]);
  });

  it("resets to level 0 on a new Run", () => {
    const highLevel = place(run({ score: 4999, best: 4999, paletteLevel: 4 }), 0, 0, 0).state;
    expect(serialize(highLevel).paletteLevel).toBe(5);

    const next = create({ seed: 1, best: highLevel.best });

    expect(serialize(next).paletteLevel).toBe(0);
    expect(shifts(place(restore({ ...serialize(next), tray: DOTS }), 0, 0, 0).events)).toEqual([]);
  });

  it("is kept across serialize and restore, so a resumed Run keeps its level", () => {
    const saved = serialize(place(run({ score: 999 }), 0, 0, 0).state);

    const resumed = restore(JSON.parse(JSON.stringify(saved)));

    expect(serialize(resumed).paletteLevel).toBe(1);
    expect(shifts(place(resumed, 1, 1, 1).events)).toEqual([]);
  });

  it("rejects a bad saved level", () => {
    expect(() => run({ paletteLevel: -1 })).toThrow(core.InvalidSaveError);
    expect(() => run({ paletteLevel: 1.5 })).toThrow(core.InvalidSaveError);
  });

  it("takes its thresholds from the tuning table", async () => {
    const tuned = await coreWithShiftEvery(50);
    const state = tuned.restore({ version: 1, board: EMPTY, tray: DOTS, score: 49 });

    const result = tuned.attemptPlacement(state, 0, { row: 0, col: 0 });

    expect(result.ok && shifts(result.events)).toEqual([{ type: "paletteShift", level: 1 }]);
  });
});

async function coreWithShiftEvery(shiftEvery: number): Promise<typeof core> {
  vi.resetModules();
  vi.doMock("../tuning/tuning", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../tuning/tuning")>();
    return { ...actual, TUNING: { ...actual.TUNING, palette: { ...actual.TUNING.palette, shiftEvery } } };
  });
  const api = await import("./index");
  vi.doUnmock("../tuning/tuning");
  return api;
}
