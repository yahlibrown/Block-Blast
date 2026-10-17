import { describe, expect, it } from "vitest";
import { RETURN_MS, returnAt } from "./returnFlight";

// Dropped at Board scale (40px Cells); its Tray spot draws it at 20px Cells.
const released = { x: 200, y: 100, cellSize: 40 };
const home = { x: 40, y: 500, cellSize: 20 };

describe("a Piece's Return to the Tray", () => {
  it("starts where the Piece was dropped", () => {
    expect(returnAt(released, home, 0)).toEqual(released);
  });

  it("moves and shrinks toward its Tray spot, fast at first then settling (eased)", () => {
    const half = returnAt(released, home, RETURN_MS / 2)!;

    // past the halfway point in position and size at half the time
    expect(half.x).toBeLessThan(120);
    expect(half.x).toBeGreaterThan(40);
    expect(half.y).toBeGreaterThan(300);
    expect(half.y).toBeLessThan(500);
    expect(half.cellSize).toBeLessThan(30);
    expect(half.cellSize).toBeGreaterThan(20);
  });

  it("is home (nothing left to animate) once the Return time is up", () => {
    expect(returnAt(released, home, RETURN_MS)).toBeNull();
    expect(returnAt(released, home, RETURN_MS + 50)).toBeNull();
  });
});
