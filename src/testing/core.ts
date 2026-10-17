// Shared scenario helpers for core tests. They only use the core's public seam
// (`src/core/index.ts`): scenarios are built with `restore`, played with `attemptPlacement`.
import { vi } from "vitest";
import type * as coreApi from "../core";
import { attemptPlacement, restore, serialize, type Cell, type GameState, type SaveData } from "../core";
import type { Tuning } from "../tuning/tuning";

/** Board from art: `.` empty, a digit = filled with that color. Missing rows are not added. */
export function board(...rows: string[]): Cell[][] {
  return rows.map((row) => [...row].map((ch) => (ch === "." ? null : Number(ch))));
}

/** An empty 8×8 Board. */
export const EMPTY: Cell[][] = board(...Array.from({ length: 8 }, () => "........"));

/** A checkerboard of single holes: nothing but a dot fits, and no dot completes a Line. */
export const HOLES: Cell[][] = board(
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
);

/** A Tray of three color-0 dots. */
export const DOTS: SaveData["tray"] = [
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
];

/** A Run restored from just the fields that matter (empty Board and a Tray of dots by default). */
export function run(data: Partial<SaveData>): GameState {
  return restore({ version: 1, board: EMPTY, tray: DOTS, ...data });
}

/** Place the Piece in `slot` with its origin at (row, col); throws if the core rejects it. */
export function place(state: GameState, slot: number, row: number, col: number) {
  const result = attemptPlacement(state, slot, { row, col });
  if (!result.ok) throw new Error(`expected Placement to succeed, got ${result.reason}`);
  return result;
}

/** Same Run, with a new Tray (so a scenario can keep placing). */
export function withTray(state: GameState, tray: SaveData["tray"]): GameState {
  return restore({ ...serialize(state), tray });
}

/**
 * A fresh copy of the core whose tuning table is `change(TUNING)`. Still the public seam,
 * just loaded against different numbers.
 */
export async function coreWithTuning(change: (tuning: Tuning) => unknown): Promise<typeof coreApi> {
  vi.resetModules();
  vi.doMock("../tuning/tuning", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../tuning/tuning")>();
    return { ...actual, TUNING: change(actual.TUNING) };
  });
  const api = await import("../core");
  vi.doUnmock("../tuning/tuning");
  return api;
}
