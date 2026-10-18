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

  it("shows the Combo Pop with the Praise, moving and fading with it", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "combo", level: 3 }, { kind: "praise", text: "Great!", tier: 1 }], 0);

    for (const t of [50, 600, 1100]) {
      const [praise, combo] = overlay.frame(t);
      expect(`${praise!.role}:${praise!.text}`).toBe("praise:Great!");
      expect(`${combo!.role}:${combo!.text}`).toBe("comboPop:COMBO ×3");
      expect(combo!.alpha).toBe(praise!.alpha);
      expect(combo!.rise).toBe(praise!.rise);
    }
  });

  it("never leaves the Combo Pop on the Board once the Praise is gone", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "praise", text: "Great!", tier: 1 }, { kind: "combo", level: 3 }], 0);

    expect(overlay.frame(5000)).toEqual([]);
    expect(overlay.busy(5000)).toBe(false);
  });

  it("drops the Combo Pop when newer Praise comes without one (a fresh Combo at ×1)", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "combo", level: 2 }, { kind: "praise", text: "Good!", tier: 0 }], 0);
    overlay.play([{ kind: "praise", text: "Great!", tier: 1 }], 300);

    expect(roles(overlay.frame(400))).toEqual(["praise:Great!"]);
  });

  it("shows nothing on the Board when the Combo breaks", () => {
    const overlay = createTextOverlay();
    overlay.play([{ kind: "comboEnd", level: 3 }], 0);

    expect(overlay.frame(100)).toEqual([]);
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

  it("pops a New Skin unlocked! banner beside Praise, outlasting it, then clears it", () => {
    const overlay = createTextOverlay();
    overlay.play(
      [
        { kind: "praise", text: "Good!", tier: 0 },
        { kind: "skinUnlocked", skin: "neon", text: "New Skin unlocked!" },
      ],
      0,
    );

    expect(roles(overlay.frame(300))).toEqual(["praise:Good!", "skinUnlocked:New Skin unlocked!"]);
    expect(roles(overlay.frame(1500))).toEqual(["skinUnlocked:New Skin unlocked!"]);
    expect(overlay.frame(10_000)).toEqual([]);
    expect(overlay.busy(10_000)).toBe(false);
  });
});
