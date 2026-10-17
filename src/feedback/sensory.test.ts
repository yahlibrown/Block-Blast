import { describe, expect, it } from "vitest";
import { attemptPlacement, restore, type GameEvent } from "../core";
import type { Sound } from "../audio/audio";
import { directFeedback } from "./director";

/** The sound and vibration part of the director's cues for one Placement. */
function sensoryCues(events: readonly GameEvent[]): { sounds: Sound[]; vibration: readonly number[] | null } {
  const cues = directFeedback(events);
  const sounds = cues.flatMap((c) => (c.kind === "sound" ? [c.sound] : []));
  const haptics = cues.flatMap((c) => (c.kind === "haptic" ? [c.pattern] : []));
  expect(haptics.length).toBeLessThanOrEqual(1);
  return { sounds, vibration: haptics[0] ?? null };
}

/** Events from a real Placement: a dot dropped at `origin` on a Board drawn as art ("#" filled). */
function place(
  rows: string[],
  origin: { row: number; col: number },
  { combo = 0, piece = "dot" as "dot" | "v2" } = {},
): readonly GameEvent[] {
  const state = restore({
    version: 1,
    board: rows.map((r) => [...r].map((ch) => (ch === "#" ? 0 : null))),
    tray: [{ piece, color: 1 }, { piece: "dot", color: 2 }, null],
    combo,
  });
  const result = attemptPlacement(state, 0, origin);
  if (!result.ok) throw new Error(result.reason);
  return result.events;
}

const EMPTY = "........";
const emptyBoard = () => Array.from({ length: 8 }, () => EMPTY);

/**
 * Events of a Placement at the top-right that Clears `lines` Lines (1 to 3).
 * A lone block at the bottom-left keeps the Board from emptying.
 */
function clearOf(lines: 1 | 2 | 3, combo = 0): readonly GameEvent[] {
  const empty = Array(6).fill(EMPTY);
  if (lines === 1) return place(["#######.", ...empty, "#......."], { row: 0, col: 7 }, { combo });
  const column = Array(6).fill(".......#");
  if (lines === 2) return place(["#######.", ...column, "#......#"], { row: 0, col: 7 }, { combo });
  return place(
    ["#######.", "#######.", ...column.slice(1), "#......#"],
    { row: 0, col: 7 },
    { combo, piece: "v2" },
  );
}

const strength = (pattern: readonly number[] | null) =>
  (pattern ?? []).reduce((sum, ms, i) => (i % 2 === 0 ? sum + ms : sum), 0);

const chimeOf = (events: readonly GameEvent[]) => {
  const chime = sensoryCues(events).sounds.find((s) => s.kind === "chime");
  if (!chime || chime.kind !== "chime") throw new Error("no chime");
  return chime;
};

describe("sound and haptic cues", () => {
  it("a Placement without a Clear thunks and taps", () => {
    const cues = sensoryCues(place(emptyBoard(), { row: 0, col: 0 }));

    expect(cues.sounds).toEqual([{ kind: "thunk" }]);
    expect(cues.vibration).not.toBeNull();
  });

  it("a Clear thunks, plays its Clear sound and a Combo chime", () => {
    const cues = sensoryCues(clearOf(2));

    expect(cues.sounds.map((s) => s.kind)).toEqual(["thunk", "clear", "chime"]);
    expect(cues.sounds[1]).toEqual({ kind: "clear", lines: 2 });
    expect(cues.sounds[2]).toMatchObject({ kind: "chime", level: 1 });
  });

  it("the Combo chime rises in pitch with each Combo step", () => {
    const frequencies = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((combo) => chimeOf(clearOf(1, combo)).frequency);

    for (let i = 1; i < frequencies.length; i++) expect(frequencies[i]).toBeGreaterThan(frequencies[i - 1]);
    expect(chimeOf(clearOf(1, 4)).level).toBe(5);
  });

  it("vibration grows stronger with the Clear size", () => {
    const placement = strength(sensoryCues(place(emptyBoard(), { row: 0, col: 0 })).vibration);
    const [one, two, three] = ([1, 2, 3] as const).map((n) => strength(sensoryCues(clearOf(n)).vibration));

    expect(one).toBeGreaterThan(placement);
    expect(two).toBeGreaterThan(one);
    expect(three).toBeGreaterThan(two);
  });

  it("a Board Clear has its own sound and the strongest vibration", () => {
    const cues = sensoryCues(place(["#######.", ...Array(7).fill(EMPTY)], { row: 0, col: 7 }));

    expect(cues.sounds.map((s) => s.kind)).toContain("boardClear");
    expect(strength(cues.vibration)).toBeGreaterThan(strength(sensoryCues(clearOf(3)).vibration));
  });

  it("no Placement, no cues", () => {
    expect(sensoryCues([])).toEqual({ sounds: [], vibration: null });
  });
});
