import { describe, expect, it } from "vitest";
import { attemptPlacement, serialize, trayFits } from "./index";
import { run, HOLES } from "../testing/core";

describe("Game Over", () => {
  it("comes when a Placement leaves no remaining Tray Piece that fits", () => {
    const state = run({
      board: HOLES,
      tray: [{ piece: "dot", color: 2 }, { piece: "h2", color: 0 }, { piece: "sq2", color: 1 }],
    });

    const result = attemptPlacement(state, 0, { row: 0, col: 1 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(result.events.map((e) => e.type)).toEqual(["piecePlaced", "gameOver"]);
    expect(result.state.over).toBe(true);
  });

  it("does not come while exactly one remaining Piece still fits", () => {
    const state = run({
      board: HOLES,
      tray: [{ piece: "dot", color: 2 }, { piece: "dot", color: 3 }, { piece: "sq2", color: 1 }],
    });

    const result = attemptPlacement(state, 0, { row: 0, col: 1 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(result.events.map((e) => e.type)).toEqual(["piecePlaced"]);
    expect(result.state.over).toBe(false);
  });

  it("is checked against a newly dealt Tray, right after it is dealt", () => {
    // Whatever the Dealer deals onto a Board of isolated holes, Game Over must
    // follow the deal exactly when no dealt Piece fits.
    for (let seed = 0; seed < 200; seed++) {
      const state = run({ board: HOLES, tray: [{ piece: "dot", color: 2 }, null, null], rng: seed });

      const result = attemptPlacement(state, 0, { row: 0, col: 1 });

      if (!result.ok) throw new Error("expected Placement to succeed");
      const stuck = trayFits(result.state).every((fits) => !fits);
      expect(result.events.map((e) => e.type)).toEqual(
        stuck ? ["piecePlaced", "trayDealt", "gameOver"] : ["piecePlaced", "trayDealt"],
      );
      expect(result.state.over).toBe(stuck);
    }
  });

  it("is final: later Placements are rejected, even ones that would fit", () => {
    const state = run({
      board: HOLES,
      tray: [{ piece: "dot", color: 2 }, { piece: "h2", color: 0 }, { piece: "sq2", color: 1 }],
    });
    const ended = attemptPlacement(state, 0, { row: 0, col: 1 });
    if (!ended.ok) throw new Error("expected Placement to succeed");
    const before = serialize(ended.state);

    expect(attemptPlacement(ended.state, 1, { row: 0, col: 3 })).toEqual({
      ok: false,
      reason: "game-over",
    });
    const withDot = run({ ...before, tray: [{ piece: "dot", color: 0 }, null, null] });
    expect(attemptPlacement(withDot, 0, { row: 0, col: 3 })).toEqual({
      ok: false,
      reason: "game-over",
    });
    expect(serialize(ended.state)).toEqual(before);
  });

  it("is kept through serialize and restore", () => {
    expect(serialize(run({ over: true })).over).toBe(true);
    expect(serialize(run({})).over).toBe(false);
  });
});
