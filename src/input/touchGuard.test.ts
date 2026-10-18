import { describe, expect, it } from "vitest";
import { cancelsTouch, type Touch } from "./touchGuard";

const touch = (t: Partial<Touch>): Touch => ({ phase: "start", fingers: 1, onPlayArea: false, inScrollable: false, ...t });

describe("touch guard", () => {
  it("cancels a touch that begins on the play area, so iOS can't swipe back, zoom or pull its toolbar", () => {
    expect(cancelsTouch(touch({ onPlayArea: true }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "move", onPlayArea: true }))).toBe(true);
  });

  it("leaves a tap on a button alone, so it still clicks", () => {
    expect(cancelsTouch(touch({}))).toBe(false);
    expect(cancelsTouch(touch({ inScrollable: true }))).toBe(false);
  });

  it("cancels every pinch, even over a panel", () => {
    expect(cancelsTouch(touch({ phase: "move", fingers: 2, inScrollable: true }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "start", fingers: 2, inScrollable: true }))).toBe(true);
  });

  it("lets one finger scroll a panel", () => {
    expect(cancelsTouch(touch({ phase: "move", inScrollable: true }))).toBe(false);
  });

  it("cancels a one-finger move anywhere else, so the page never scrolls or bounces", () => {
    expect(cancelsTouch(touch({ phase: "move" }))).toBe(true);
  });
});
