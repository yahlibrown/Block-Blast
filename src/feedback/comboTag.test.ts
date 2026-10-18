import { describe, expect, it } from "vitest";
import { createComboTag } from "./comboTag";

describe("Combo Tag", () => {
  it("bumps when the Combo grows, then rests at the level for as long as the Combo lasts", () => {
    const tag = createComboTag();
    tag.play([{ kind: "combo", level: 3 }], 0);

    expect(tag.frame(60)!.scale).toBeGreaterThan(1);
    expect(tag.busy(60)).toBe(true);
    expect(tag.frame(60_000)).toEqual({ level: 3, scale: 1, alpha: 1 });
    expect(tag.busy(60_000)).toBe(false);
  });

  it("fades out calmly when the Combo breaks, then hides", () => {
    const tag = createComboTag();
    tag.play([{ kind: "combo", level: 4 }], 0);
    tag.play([{ kind: "comboEnd", level: 4 }], 10_000);

    const fading = tag.frame(10_200)!;
    expect(fading.level).toBe(4);
    expect(fading.alpha).toBeGreaterThan(0);
    expect(fading.alpha).toBeLessThan(1);
    expect(tag.busy(10_200)).toBe(true);
    expect(tag.frame(11_000)).toBeNull();
    expect(tag.busy(11_000)).toBe(false);
  });

  it("comes back with a bump when a new Combo reaches ×2 during the fade", () => {
    const tag = createComboTag();
    tag.play([{ kind: "combo", level: 4 }], 0);
    tag.play([{ kind: "comboEnd", level: 4 }], 10_000);
    tag.play([{ kind: "combo", level: 2 }], 10_100);

    expect(tag.frame(20_000)).toEqual({ level: 2, scale: 1, alpha: 1 });
  });

  it("shows a resumed Run's Combo at once, with no bump", () => {
    const tag = createComboTag();
    tag.show(5);

    expect(tag.frame(0)).toEqual({ level: 5, scale: 1, alpha: 1 });
    expect(tag.busy(0)).toBe(false);
  });

  it("stays hidden for a resumed Run below ×2", () => {
    const tag = createComboTag();
    tag.show(1);

    expect(tag.frame(0)).toBeNull();
  });

  it("hides at once for a new Run", () => {
    const tag = createComboTag();
    tag.play([{ kind: "combo", level: 3 }], 0);
    tag.reset();

    expect(tag.frame(100)).toBeNull();
    expect(tag.busy(100)).toBe(false);
  });
});
