import { describe, expect, it, vi } from "vitest";
import * as core from "./index";
import {
  attemptPlacement,
  create,
  BOARD_SIZE,
  PIECE_IDS,
  restore,
  serialize,
  trayFits,
  type Cell,
  type GameState,
  type PieceId,
} from "./index";

/** Small seeded generator for building test Boards (independent of the core's RNG). */
function testRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A random Board where each Cell is filled with probability `density`. */
function randomBoard(random: () => number, density: number): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => (random() < density ? 1 : null)),
  );
}

/** Restore a Run on `board` whose Tray holds only a dot, so placing it deals a new Tray. */
function lastDotOn(board: Cell[][], rng: number): GameState {
  return restore({ version: 1, board, tray: [{ piece: "dot", color: 0 }, null, null], rng });
}

function firstEmpty(board: Cell[][]): { row: number; col: number } | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row]![col] === null) return { row, col };
    }
  }
  return null;
}

/** Does the catalogue Piece `id` fit anywhere on the Board of `state`? */
function catalogueFits(state: GameState, id: PieceId): boolean {
  const probe = restore({
    version: 1,
    board: serialize(state).board,
    tray: [{ piece: id, color: 0 }, null, null],
  });
  return trayFits(probe)[0]!;
}

/** Place the last Piece and return the state right after the new Tray is dealt. */
function dealAfterPlacingDot(board: Cell[][], rng: number): GameState | null {
  const origin = firstEmpty(board);
  if (!origin) return null;
  const result = attemptPlacement(lastDotOn(board, rng), 0, origin);
  if (!result.ok) throw new Error("dot should fit on an empty Cell");
  expect(result.events.some((e) => e.type === "trayDealt")).toBe(true);
  return result.state;
}

/** Play up to `moves` Placements (first fitting slot and origin each time); return every Tray dealt. */
function playTrays(start: GameState, moves: number): unknown[] {
  const trays: unknown[] = [serialize(start).tray];
  let state = start;
  for (let n = 0; n < moves; n++) {
    let next: GameState | null = null;
    for (let slot = 0; slot < 3 && !next; slot++) {
      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE && !next; i++) {
        const result = attemptPlacement(state, slot, { row: Math.floor(i / BOARD_SIZE), col: i % BOARD_SIZE });
        if (!result.ok) continue;
        next = result.state;
        for (const e of result.events) if (e.type === "trayDealt") trays.push(serialize(next).tray);
      }
    }
    if (!next) break;
    state = next;
  }
  return trays;
}

describe("seeded dealing", () => {
  it("deals the same Trays from the same seed and the same Placements", () => {
    const a = playTrays(create({ seed: 42 }), 60);
    const b = playTrays(create({ seed: 42 }), 60);

    expect(a.length).toBeGreaterThan(5);
    expect(a).toEqual(b);
    expect(playTrays(create({ seed: 43 }), 60)).not.toEqual(a);
  });

  it("deals the same Trays after a Run is saved and restored mid-way", () => {
    let state = create({ seed: 5 });
    for (let n = 0; n < 4; n++) {
      const slot = state.tray.findIndex((t) => t !== null);
      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const result = attemptPlacement(state, slot, { row: Math.floor(i / BOARD_SIZE), col: i % BOARD_SIZE });
        if (result.ok) {
          state = result.state;
          break;
        }
      }
    }

    const resumed = restore(JSON.parse(JSON.stringify(serialize(state))));

    expect(playTrays(resumed, 40)).toEqual(playTrays(state, 40));
  });
});

describe("the Dealer's fit guarantee", () => {
  it("deals at least one fitting Piece on every Board where any Piece fits", () => {
    const random = testRandom(2024);
    let checked = 0;
    for (const density of [0.3, 0.6, 0.8, 0.9, 0.95, 0.98]) {
      for (let i = 0; i < 150; i++) {
        const state = dealAfterPlacingDot(randomBoard(random, density), i * 7919 + 13);
        if (!state) continue;
        if (!PIECE_IDS.some((id) => catalogueFits(state, id))) continue;
        checked++;
        expect(trayFits(state).some(Boolean)).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(500);
  });
});

/** A Board with a few nearly full Lines (1–2 gaps each) over light noise. */
function nearMissBoard(random: () => number): Cell[][] {
  const b = randomBoard(random, 0.25);
  const lines = 1 + Math.floor(random() * 3);
  for (let n = 0; n < lines; n++) {
    const index = Math.floor(random() * BOARD_SIZE);
    const horizontal = random() < 0.5;
    const gaps = new Set([Math.floor(random() * BOARD_SIZE), Math.floor(random() * BOARD_SIZE)]);
    for (let i = 0; i < BOARD_SIZE; i++) {
      const [row, col] = horizontal ? [index, i] : [i, index];
      b[row]![col] = gaps.has(i) ? null : 1;
    }
  }
  return b;
}

/** Could the Piece in `slot` complete a Line at some origin? */
function canCompleteLine(api: typeof core, state: GameState, slot: number): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const fit = api.queryFit(state, slot, { row, col });
      if (fit.fits && fit.rows.length + fit.cols.length > 0) return true;
    }
  }
  return false;
}

/** Over a fixed set of near-miss Boards, the share of dealt Pieces that could complete a Line. */
function lineCompletingShare(api: typeof core): number {
  const random = testRandom(99);
  let dealt = 0;
  let completing = 0;
  for (let i = 0; i < 400; i++) {
    const state = api.restore({
      version: 1,
      board: nearMissBoard(random),
      tray: [{ piece: "dot", color: 0 }, null, null],
      rng: i,
    });
    // Place the Tray's last Piece (a dot) in the first Cell where it clears nothing.
    let after: GameState | null = null;
    for (let row = 0; row < BOARD_SIZE && !after; row++) {
      for (let col = 0; col < BOARD_SIZE && !after; col++) {
        const fit = api.queryFit(state, 0, { row, col });
        if (!fit.fits || fit.rows.length + fit.cols.length > 0) continue;
        const result = api.attemptPlacement(state, 0, { row, col });
        if (result.ok) after = result.state;
      }
    }
    if (!after) continue;
    for (let slot = 0; slot < 3; slot++) {
      dealt++;
      if (canCompleteLine(api, after, slot)) completing++;
    }
  }
  expect(dealt).toBeGreaterThan(1000);
  return completing / dealt;
}

/** A fresh copy of the core whose tuning table has `lineBias` swapped in. */
async function coreWithLineBias(lineBias: number): Promise<typeof core> {
  vi.resetModules();
  vi.doMock("../tuning/tuning", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../tuning/tuning")>();
    return { ...actual, TUNING: { ...actual.TUNING, dealer: { ...actual.TUNING.dealer, lineBias } } };
  });
  const api = await import("./index");
  vi.doUnmock("../tuning/tuning");
  return api;
}

describe("the Dealer's Line bias", () => {
  it("deals Line-completing Pieces more often with the tuned bias on than with it off", async () => {
    const off = lineCompletingShare(await coreWithLineBias(0));
    const on = lineCompletingShare(core);

    expect(on).toBeGreaterThan(off * 1.2);
  });
});
