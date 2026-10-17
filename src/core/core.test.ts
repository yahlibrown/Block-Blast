import { describe, expect, it } from "vitest";
import { create, InvalidSaveError, PIECES, PIECE_IDS, restore, serialize } from "./index";

describe("a new Run", () => {
  it("starts on an empty 8×8 Board", () => {
    const state = create({ seed: 1 });

    expect(state.board).toHaveLength(8);
    for (const row of state.board) {
      expect(row).toHaveLength(8);
      expect(row.every((cell) => cell === null)).toBe(true);
    }
  });

  it("starts with a full Tray of three Pieces", () => {
    const state = create({ seed: 1 });

    expect(state.tray).toHaveLength(3);
    expect(state.tray.every((slot) => slot !== null)).toBe(true);
  });

  it("deals the same Tray from the same seed", () => {
    expect(serialize(create({ seed: 7 }))).toEqual(serialize(create({ seed: 7 })));
    const trays = new Set(
      Array.from({ length: 20 }, (_, seed) => JSON.stringify(serialize(create({ seed })).tray)),
    );
    expect(trays.size).toBeGreaterThan(1);
  });
});

describe("the Piece catalogue", () => {
  const shape = (id: (typeof PIECE_IDS)[number]): string[] => {
    const p = PIECES[id];
    return Array.from({ length: p.rows }, (_, r) =>
      Array.from({ length: p.cols }, (_, c) =>
        p.blocks.some((b) => b.row === r && b.col === c) ? "#" : ".",
      ).join(""),
    );
  };
  const shapes = PIECE_IDS.map((id) => shape(id).join("/"));

  it("contains Block Blast's standard shapes, each orientation as its own Piece", () => {
    for (const expected of [
      "#",
      "##",
      "#/#",
      "###",
      "#####",
      "#/#/#/#/#",
      "##/##",
      "###/###/###",
      "###/###",
      "##/##/##",
      "##/#.",
      "###/#../#..",
      "..#/..#/###",
      "#./#./##",
      ".#./###",
      "###/.#.",
      ".##/##.",
      "##./.##",
    ]) {
      expect(shapes).toContain(expected);
    }
  });

  it("has no duplicate shapes", () => {
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});

describe("serialize and restore", () => {
  it("round-trips a Run", () => {
    const state = create({ seed: 99 });

    expect(serialize(restore(serialize(state)))).toEqual(serialize(state));
  });

  it("refuses data from another version or with a bad shape", () => {
    const good = serialize(create({ seed: 1 }));
    const bad = [
      { ...good, version: 2 },
      { ...good, board: good.board.slice(1) },
      { ...good, tray: [null, null] },
      { ...good, tray: [{ piece: "nope", color: 0 }, null, null] },
      { ...good, board: good.board.map(() => Array(8).fill(99)) },
    ];
    for (const data of bad) {
      expect(() => restore(data as never)).toThrow(InvalidSaveError);
    }
  });
});
