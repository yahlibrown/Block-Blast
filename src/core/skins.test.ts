import { describe, expect, it, vi } from "vitest";
import type * as core from "./index";
import {
  attemptPlacement,
  create,
  profileOf,
  restore,
  serialize,
  skinProgress,
  SKINS,
  type GameEvent,
  type GameState,
  type SaveData,
} from "./index";

/** Board from art: `.` empty, a digit = filled with that color. 8 rows of 8. */
function board(...rows: string[]): (number | null)[][] {
  return rows.map((row) => [...row].map((ch) => (ch === "." ? null : Number(ch))));
}

const EMPTY = board(...Array.from({ length: 8 }, () => "........"));

/** Isolated holes: only a dot fits, and no dot completes a Line. */
const HOLES = board(
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
  "1.1.1.1.",
  ".1.1.1.1",
);

const DOTS: SaveData["tray"] = [
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
  { piece: "dot", color: 0 },
];

function run(data: Partial<SaveData>): GameState {
  return restore({ version: 1, board: EMPTY, tray: DOTS, ...data });
}

function placed(state: GameState, slot: number, row: number, col: number) {
  const result = attemptPlacement(state, slot, { row, col });
  if (!result.ok) throw new Error(`expected Placement to succeed, got ${result.reason}`);
  return result;
}

/** One dot onto a Board of holes, with a Tray that can't fit anything else: the Run ends. */
function endRun(state: GameState): { state: GameState; events: readonly GameEvent[] } {
  const ending = restore({
    ...serialize(state),
    board: HOLES,
    tray: [{ piece: "dot", color: 2 }, { piece: "h2", color: 0 }, null],
  });
  return placed(ending, 0, 0, 1);
}

const skinEvents = (events: readonly GameEvent[]) => events.filter((e) => e.type === "skinUnlocked");

const [FIRST, SECOND, THIRD] = SKINS;

describe("Lifetime Points", () => {
  it("start at 0 with only the first Skin unlocked", () => {
    const state = create({ seed: 1 });

    expect(profileOf(state)).toEqual({ best: 0, lifetime: 0, unlocked: [FIRST!.id] });
  });

  it("add the Run's final score at Game Over, carried in the gameOver event", () => {
    const { state, events } = endRun(run({ score: 120, lifetime: 1000 }));

    // The ending dot scores 1 point.
    expect(events.at(-1)).toEqual({
      type: "gameOver",
      score: 121,
      lifetime: 1121,
      skinsUnlocked: [],
    });
    expect(state.lifetime).toBe(1121);
  });

  it("are not added before Game Over", () => {
    const { state } = placed(run({ score: 120, lifetime: 1000 }), 0, 0, 0);

    expect(state.lifetime).toBe(1000);
  });

  it("accumulate across Runs started from the previous Run's profile", () => {
    const first = endRun(run({ score: 99, lifetime: 0 })).state; // 100
    const second = endRun(run({ ...serialize(create({ seed: 2, profile: profileOf(first) })), tray: DOTS, score: 49 })).state; // 50

    expect(first.lifetime).toBe(100);
    expect(second.lifetime).toBe(150);
    expect(create({ seed: 3, profile: profileOf(second) }).lifetime).toBe(150);
  });
});

describe("Skin unlocks", () => {
  it("are tuned so the first Skin is free and thresholds rise", () => {
    expect(SKINS).toHaveLength(5);
    expect(FIRST!.threshold).toBe(0);
    for (let i = 1; i < SKINS.length; i++) {
      expect(SKINS[i]!.threshold).toBeGreaterThan(SKINS[i - 1]!.threshold);
    }
  });

  it("fire mid-Run when Lifetime Points plus the score reach a threshold", () => {
    const target = SECOND!.threshold;
    const state = run({ lifetime: target - 10, score: 9 });

    const result = placed(state, 0, 0, 0); // +1 point reaches it exactly

    expect(skinEvents(result.events)).toEqual([{ type: "skinUnlocked", skin: SECOND!.id }]);
    expect(result.state.unlocked).toEqual([FIRST!.id, SECOND!.id]);
    expect(result.state.over).toBe(false);
  });

  it("come after newBest and before trayDealt", () => {
    const state = run({
      lifetime: SECOND!.threshold - 10,
      score: 9,
      best: 9,
      tray: [{ piece: "dot", color: 0 }, null, null],
    });

    const types = placed(state, 0, 0, 0).events.map((e) => e.type);

    expect(types.slice(0, 4)).toEqual(["piecePlaced", "newBest", "skinUnlocked", "trayDealt"]);
  });

  it("fire only once per Skin", () => {
    let state = run({ lifetime: SECOND!.threshold - 1, score: 0 });
    const fired: GameEvent[] = [];
    for (let i = 0; i < 4; i++) {
      const result = placed(restore({ ...serialize(state), tray: DOTS }), 0, 0, i);
      fired.push(...skinEvents(result.events));
      state = result.state;
    }

    expect(fired).toEqual([{ type: "skinUnlocked", skin: SECOND!.id }]);
  });

  it("never re-fire for a Skin already unlocked, even in a later Run", () => {
    const first = endRun(run({ lifetime: SECOND!.threshold - 1 })).state;
    expect(first.unlocked).toContain(SECOND!.id);

    const next = create({ seed: 5, profile: profileOf(first) });
    const result = placed(restore({ ...serialize(next), tray: DOTS }), 0, 0, 0);

    expect(skinEvents(result.events)).toEqual([]);
  });

  it("fire once each, in threshold order, when a Placement crosses two thresholds", async () => {
    // Thresholds tuned close together, so one Clear (1 block + 10 Clear points) passes two.
    const api = await coreWithThresholds([0, 100, 105, 200, 300]);
    const [a, b, c] = api.SKINS;
    const state = api.restore({
      version: 1,
      // The block at the bottom stays, so this is no Board Clear.
      board: board("1111111.", ...Array.from({ length: 6 }, () => "........"), "1......."),
      tray: DOTS,
      lifetime: 95,
    });

    const result = api.attemptPlacement(state, 0, { row: 0, col: 7 });

    if (!result.ok) throw new Error("expected Placement to succeed");
    expect(skinEvents(result.events)).toEqual([
      { type: "skinUnlocked", skin: b!.id },
      { type: "skinUnlocked", skin: c!.id },
    ]);
    expect(result.state.unlocked).toEqual([a!.id, b!.id, c!.id]);
  });

  it("at Game Over: the ending Placement can unlock, and the event lists this Run's unlocks", () => {
    const midRun = placed(run({ lifetime: SECOND!.threshold - 2, score: 0 }), 0, 0, 0).state;
    expect(midRun.unlocked).not.toContain(SECOND!.id);

    const { events } = endRun(midRun); // the ending dot reaches the threshold

    expect(events.map((e) => e.type)).toEqual(["piecePlaced", "skinUnlocked", "gameOver"]);
    expect(events.at(-1)).toMatchObject({ skinsUnlocked: [SECOND!.id], lifetime: SECOND!.threshold });
  });

  it("this Run's unlocks reset on a new Run", () => {
    const ended = endRun(run({ lifetime: SECOND!.threshold - 1 })).state;
    expect(ended.runUnlocked).toEqual([SECOND!.id]);

    expect(create({ seed: 9, profile: profileOf(ended) }).runUnlocked).toEqual([]);
  });
});

describe("progress toward the next Skin", () => {
  it("counts this Run's score and runs from the last unlocked threshold to the next", () => {
    const state = run({ lifetime: SECOND!.threshold + 100, score: 50 });

    expect(skinProgress(state)).toEqual({
      points: SECOND!.threshold + 150,
      next: THIRD,
      from: SECOND!.threshold,
    });
  });

  it("does not count a finished Run's score twice", () => {
    const { state } = endRun(run({ lifetime: 1000, score: 99 }));

    expect(skinProgress(state)).toMatchObject({ points: 1100, next: SECOND, from: 0 });
  });

  it("has no next Skin once every Skin is unlocked", () => {
    const state = run({ lifetime: SKINS.at(-1)!.threshold });

    expect(skinProgress(state).next).toBeNull();
  });
});

describe("the profile", () => {
  it("passed to create sets the Best Score, Lifetime Points and unlocked Skins", () => {
    const state = create({
      seed: 4,
      profile: { best: 777, lifetime: SECOND!.threshold + 5, unlocked: [FIRST!.id, SECOND!.id] },
    });

    expect(profileOf(state)).toEqual({
      best: 777,
      lifetime: SECOND!.threshold + 5,
      unlocked: [FIRST!.id, SECOND!.id],
    });
    expect(state.runStartBest).toBe(777);
  });

  it("always includes the first Skin and any Skin its Lifetime Points already reach", () => {
    const state = create({ seed: 4, profile: { lifetime: SECOND!.threshold, unlocked: [] } });

    expect(state.unlocked).toEqual([FIRST!.id, SECOND!.id]);
  });

  it("keeps unlocked Skins even if Lifetime Points are below their threshold", () => {
    const state = create({ seed: 4, profile: { lifetime: 0, unlocked: [THIRD!.id] } });

    expect(state.unlocked).toEqual([FIRST!.id, THIRD!.id]);
  });

  it("survives serialize and restore (through JSON)", () => {
    const original = run({
      score: 30,
      lifetime: SECOND!.threshold + 1,
      unlocked: [FIRST!.id, SECOND!.id, THIRD!.id],
      runUnlocked: [THIRD!.id],
    });

    const restored = restore(JSON.parse(JSON.stringify(serialize(original))));

    expect(profileOf(restored)).toEqual(profileOf(original));
    expect(restored.runUnlocked).toEqual([THIRD!.id]);
    expect(serialize(restored)).toEqual(serialize(original));
  });

  it("defaults in restore: unlocks follow Lifetime Points plus the score", () => {
    const state = run({ lifetime: SECOND!.threshold - 5, score: 5 });

    expect(state.unlocked).toEqual([FIRST!.id, SECOND!.id]);
    expect(state.runUnlocked).toEqual([]);
  });

  it("a finished Run's banked score is not counted twice", () => {
    const state = run({ over: true, score: 10, lifetime: SECOND!.threshold - 5 });

    expect(state.unlocked).toEqual([FIRST!.id]);
  });

  it.each([
    ["negative Lifetime Points", { lifetime: -1 }],
    ["fractional Lifetime Points", { lifetime: 1.5 }],
    ["unlocked not an array", { unlocked: "classic" }],
    ["a non-string Skin", { unlocked: [3] }],
    ["runUnlocked not an array", { runUnlocked: {} }],
  ])("rejects a save with %s", (_, bad) => {
    expect(() => run(bad as Partial<SaveData>)).toThrow();
  });

  it("ignores unknown Skin ids in a save", () => {
    const state = run({ unlocked: ["retired-skin", SECOND!.id] });

    expect(state.unlocked).toEqual([FIRST!.id, SECOND!.id]);
  });
});

/** The core with the Skin thresholds replaced (same Skins, in order). */
async function coreWithThresholds(values: readonly number[]): Promise<typeof core> {
  vi.resetModules();
  vi.doMock("../tuning/tuning", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../tuning/tuning")>();
    const ids = Object.keys(actual.TUNING.skins.thresholds);
    const thresholds = Object.fromEntries(ids.map((id, i) => [id, values[i]]));
    return { ...actual, TUNING: { ...actual.TUNING, skins: { ...actual.TUNING.skins, thresholds } } };
  });
  const api = await import("./index");
  vi.doUnmock("../tuning/tuning");
  return api;
}
