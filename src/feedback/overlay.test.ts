import { describe, expect, it } from "vitest";
import { createTextOverlay } from "./overlay";

const roles = (frames: { role: string; text: string }[]) => frames.map((f) => `${f.role}:${f.text}`);

describe("text overlay", () => {
  it("pops Praise in, then lets it fade away", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "praise", text: "Great!", tier: 1 }], 0);

    const start = overlay.frame(0)[0]!;
    const middle = overlay.frame(500)[0]!;
    expect(start.scale).toBeLessThan(middle.scale);
    expect(middle.alpha).toBe(1);
    expect(overlay.frame(5000)).toEqual([]);
    expect(overlay.busy(5000)).toBe(false);
  });

  it("shows only the newest Praise", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "praise", text: "Good!", tier: 0 }], 0);
    overlay.play([{ kind: "praise", text: "Amazing!", tier: 3 }], 300);

    expect(roles(overlay.frame(400))).toEqual(["praise:Amazing!"]);
  });

  it("keeps COMBO ×N up while the Combo lasts, and fades it when it breaks", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "combo", level: 3 }], 0);

    expect(roles(overlay.frame(60_000))).toEqual(["combo:COMBO ×3"]);
    expect(overlay.busy(60_000)).toBe(false); // nothing moving: no frames needed

    overlay.play([{ kind: "comboEnd", level: 3 }], 60_000);
    expect(overlay.busy(60_100)).toBe(true);
    expect(overlay.frame(60_100)[0]!.alpha).toBeLessThan(1);
    expect(overlay.frame(70_000)).toEqual([]);
  });

  it("bursts NEW BEST! once and then clears it", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "newBest", score: 120 }], 0);

    expect(roles(overlay.frame(300))).toEqual(["newBest:NEW BEST!"]);
    expect(overlay.frame(10_000)).toEqual([]);
  });

  it("clears everything for a new Run", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "combo", level: 2 }, { kind: "praise", text: "Good!", tier: 0 }], 0);

    overlay.reset();

    expect(overlay.frame(100)).toEqual([]);
  });
});
