import { describe, expect, it } from "vitest";
import { create } from "./index";

describe("a new Run", () => {
  it("starts on an empty 8×8 Board", () => {
    const state = create({ seed: 1 });

    expect(state.board).toHaveLength(8);
    for (const row of state.board) {
      expect(row).toHaveLength(8);
      expect(row.every((cell) => cell === null)).toBe(true);
    }
  });
});
