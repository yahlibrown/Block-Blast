import { describe, expect, it } from "vitest";
import {
  attemptPlacement,
  create,
  restore,
  serialize,
  type GameEvent,
  type GameState,
  type SaveData,
} from "./index";

/** Board from art: `.` empty, a digit = filled with that color. 8 rows of 8. */
function board(...rows: string[]): (number | null)[][] {
  return rows.map((row) => [...row].map((ch) => (ch === "." ? null : Number(ch))));
}

const EMPTY = board(...Array.from({ length: 8 }, () => "........"));

const DOTS: SaveData["tray"] = [
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
];

function run(data: Partial<SaveData>): GameState {
  return restore({ version: 1, board: EMPTY, tray: DOTS, ...data });
}

/** Place one dot per Placement on the first empty Cell (Tray refilled each time); returns each Placement's events. */
function placeDots(state: GameState, count: number): { state: GameState; events: GameEvent[][] } {
  const events: GameEvent[][] = [];
  for (let i = 0; i < count; i++) {
    state = restore({ ...serialize(state), tray: DOTS });
    const at = state.board.flat().indexOf(null);
    const result = attemptPlacement(state, 0, { row: Math.floor(at / 8), col: at % 8 });
    if (!result.ok) throw new Error(`expected Placement to succeed, got ${result.reason}`);
    state = result.state;
    events.push([...result.events]);
  }
  return { state, events };
}

const newBests = (events: GameEvent[][]) =>
  events.map((e) => e.filter((ev) => ev.type === "newBest"));

describe("NEW BEST", () => {
  it("fires at the first Placement that pushes the score past the Best Score", () => {
    const { events } = placeDots(run({ score: 4, best: 5 }), 2);

    // 4 → 5 only ties the Best Score; 5 → 6 passes it.
    expect(newBests(events)).toEqual([[], [{ type: "newBest", score: 6, previous: 5 }]]);
  });

  it("fires only once per Run, even as the score keeps climbing", () => {
    const { events } = placeDots(run({ score: 5, best: 5 }), 6);

    expect(newBests(events).flat()).toHaveLength(1);
    expect(newBests(events)[0]).toHaveLength(1);
  });

  it("does not fire while the score stays below the Best Score", () => {
    const { events } = placeDots(run({ score: 0, best: 50 }), 3);

    expect(newBests(events).flat()).toEqual([]);
  });

  it("does not fire on a first-ever Run with a Best Score of 0", () => {
    const { events } = placeDots(create({ seed: 1 }), 3);

    expect(newBests(events).flat()).toEqual([]);
  });

  it("comes after the Clear events and before the new Tray is dealt", () => {
    const state = run({
      board: board(
        "1.......",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "1111111.",
      ),
      tray: [{ piece: "dot", color: 0 }, null, null],
      best: 5,
    });

    const result = attemptPlacement(state, 0, { row: 7, col: 7 });

    if (!result.ok) throw new Error(result.reason);
    expect(result.events.map((e) => e.type)).toEqual([
      "piecePlaced",
      "linesCleared",
      "comboIncreased",
      "newBest",
      "trayDealt",
    ]);
  });

  it("does not fire again after a save and restore mid-Run", () => {
    const first = placeDots(run({ score: 5, best: 5 }), 1);
    expect(newBests(first.events).flat()).toHaveLength(1);

    const { events } = placeDots(restore(serialize(first.state)), 2);

    expect(newBests(events).flat()).toEqual([]);
  });

  it("measures the next Run against the Best Score it starts with", () => {
    const first = placeDots(run({ score: 5, best: 5 }), 1); // Best Score is now 6
    const next = create({ seed: 2, best: first.state.best });

    const { events } = placeDots(restore({ ...serialize(next), score: 6 }), 1);

    expect(newBests(events)).toEqual([[{ type: "newBest", score: 7, previous: 6 }]]);
  });
});
