import { describe, expect, it } from "vitest";
import { COLOR_COUNT, SKINS } from "../core";
import { BASE_BACKDROP } from "./palette";
import { skinLook } from "./skins";

const HEX = /^#[0-9a-f]{6}$/i;

describe("Skin looks", () => {
  it("exist for every Skin the core can unlock, each named", () => {
    for (const { id } of SKINS) {
      expect(skinLook(id).id).toBe(id);
      expect(skinLook(id).name.length).toBeGreaterThan(0);
    }
  });

  it("each give a full block palette, Board colors and a base Backdrop", () => {
    for (const { id } of SKINS) {
      const look = skinLook(id);
      expect(look.blocks).toHaveLength(COLOR_COUNT);
      for (const color of [...look.blocks, look.board, look.emptyCell, look.backdrop.background, look.backdrop.glow]) {
        expect(color).toMatch(HEX);
      }
    }
  });

  it("are distinct: no two share a block style or block palette", () => {
    const looks = SKINS.map(({ id }) => skinLook(id));
    expect(new Set(looks.map((l) => l.style)).size).toBe(SKINS.length);
    expect(new Set(looks.map((l) => l.blocks.join())).size).toBe(SKINS.length);
  });

  it("start from the default look: the first Skin's Backdrop is the base one", () => {
    expect(skinLook(SKINS[0]!.id).backdrop).toEqual(BASE_BACKDROP);
  });
});
