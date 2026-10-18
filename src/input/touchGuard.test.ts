import { describe, expect, it } from "vitest";
import { cancelsTouch, type GuardedTouch } from "./touchGuard";

const touch = (t: Partial<GuardedTouch>): GuardedTouch => ({
  phase: "start",
  fingers: 1,
  onPlayArea: false,
  onControl: false,
  inScrollable: false,
  ...t,
});

describe("touch guard", () => {
  it("cancels a touch that begins on the play area, so iOS can't swipe back, zoom or pull its toolbar", () => {
    expect(cancelsTouch(touch({ onPlayArea: true }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "move", onPlayArea: true }))).toBe(true);
  });

  it("leaves a tap on a button alone, so it still clicks", () => {
    expect(cancelsTouch(touch({ onControl: true }))).toBe(false);
    expect(cancelsTouch(touch({ onControl: true, inScrollable: true }))).toBe(false);
  });

  it("leaves a touch that begins inside a panel alone, so it can scroll", () => {
    expect(cancelsTouch(touch({ inScrollable: true }))).toBe(false);
  });

  it("cancels a touch that begins on bare page off the play area (the HUD band, a dimmed backdrop), so an edge swipe there can't go back", () => {
    expect(cancelsTouch(touch({}))).toBe(true);
  });

  it("cancels every pinch, even over a panel or a button", () => {
    expect(cancelsTouch(touch({ phase: "move", fingers: 2, inScrollable: true }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "start", fingers: 2, inScrollable: true }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "start", fingers: 2, onControl: true }))).toBe(true);
  });

  it("lets one finger scroll a panel", () => {
    expect(cancelsTouch(touch({ phase: "move", inScrollable: true }))).toBe(false);
  });

  it("cancels a one-finger move anywhere else, so the page never scrolls or bounces", () => {
    expect(cancelsTouch(touch({ phase: "move" }))).toBe(true);
    expect(cancelsTouch(touch({ phase: "move", onControl: true }))).toBe(true);
  });
});
