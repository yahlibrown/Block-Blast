import { describe, expect, it } from "vitest";
import { SKINS } from "../core";
import { activeSkin } from "./skins";

const [FIRST, SECOND, THIRD] = SKINS.map((s) => s.id);

describe("the Skin on show", () => {
  it("is the chosen Skin when it is unlocked", () => {
    expect(activeSkin([FIRST!, SECOND!], SECOND!)).toBe(SECOND);
  });

  it("falls back to the first Skin when the chosen one is locked", () => {
    expect(activeSkin([FIRST!, SECOND!], THIRD!)).toBe(FIRST);
  });
});
