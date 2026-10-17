import { describe, expect, it } from "vitest";
import { createCountUp } from "./countUp";

describe("score count-up", () => {
  it("starts from the old value and lands exactly on the new one", () => {
    const score = createCountUp(100);
    score.to(160, 1000);

    expect(score.value(1000)).toBe(100);
    expect(score.value(10_000)).toBe(160);
    expect(score.done(10_000)).toBe(true);
  });

  it("rolls up through whole numbers in between, never backwards", () => {
    const score = createCountUp(0);
    score.to(300, 0);

    const seen = [50, 100, 150, 200, 250].map((t) => score.value(t));
    expect(seen.every(Number.isInteger)).toBe(true);
    expect(seen.some((v) => v > 0 && v < 300)).toBe(true);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
    expect(score.done(100)).toBe(false);
  });

  it("continues from where it is shown when a new target arrives mid-roll", () => {
    const score = createCountUp(0);
    score.to(100, 0);
    const shown = score.value(100);

    score.to(200, 100);

    expect(score.value(100)).toBe(shown);
    expect(score.value(10_000)).toBe(200);
  });

  it("jumps without rolling when set (a new Run starts at 0)", () => {
    const score = createCountUp(500);
    score.set(0);

    expect(score.value(0)).toBe(0);
    expect(score.done(0)).toBe(true);
  });
});
