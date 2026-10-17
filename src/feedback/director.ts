// Feedback director: turns one Placement's core events into feedback cues.
// Pure: it decides *what* the player gets (which Praise, which display, how hard a
// Clear hits); players play the cues (text pops; Clear effects from `clearCues.ts`;
// sound and haptic cues from `sensory.ts`).
//
// Extending (tickets 10, 11, …): add members to `FeedbackCue` and push them from
// the matching event's case below. Cues come out in event order, and players
// switch on `kind` and ignore kinds they don't handle, so a new kind never
// breaks an existing player.
import type { GameEvent, SkinId } from "../core";
import type { Sound } from "../audio/audio";
import { CLEAR_SHAKE, shakeMagnitude, type ClearedCell } from "./clearCues";
import { COMBO_DISPLAY_FROM, PRAISE, praiseTier } from "./praise";
import { soundsFor, vibrationFor } from "./sensory";

export type FeedbackCue =
  /** Praise text after a Clear; `tier` 0 (Good!) .. PRAISE.length-1 (Unbelievable!). */
  | { readonly kind: "praise"; readonly text: string; readonly tier: number }
  /** Show or raise the "COMBO ×N" display. */
  | { readonly kind: "combo"; readonly level: number }
  /** A shown Combo broke: fade the display out calmly. */
  | { readonly kind: "comboEnd"; readonly level: number }
  /** The first time this Run the score passed the Best Score. */
  | { readonly kind: "newBest"; readonly score: number }
  /** A Skin unlocked mid-Run: a Praise-style "New Skin unlocked!" banner (one per Skin). */
  | { readonly kind: "skinUnlocked"; readonly skin: SkinId; readonly text: string }
  /** Cleared Cells flash in their old colors, then burst into particles; `big` = Board Clear celebration. */
  | { readonly kind: "burst"; readonly cells: readonly ClearedCell[]; readonly big: boolean }
  /** Shake the Board: `magnitude` in Cells, decaying over `durationMs`. */
  | { readonly kind: "shake"; readonly magnitude: number; readonly durationMs: number }
  /** Flash the whole Board white (Board Clear). */
  | { readonly kind: "boardFlash" }
  /** Play a generated sound (see `audio`). */
  | { readonly kind: "sound"; readonly sound: Sound }
  /** Vibrate with this pattern (ms on, off, on, ...). At most one per Placement, last. */
  | { readonly kind: "haptic"; readonly pattern: readonly number[] };

export type FeedbackCueKind = FeedbackCue["kind"];

/**
 * Plays the director's cues over time (text pops, Clear effects, sound and haptics).
 * One shape, so the shell feeds every player the same cues in one loop.
 */
export interface CuePlayer {
  /** Start the cues this player handles; ignore every other kind. `now` = rAF-time ms. */
  play(cues: readonly FeedbackCue[], now: number): void;
  /** Drop everything still playing (a new Run starts). */
  reset(): void;
  /** Is anything still moving at `now`? (The frame loop keeps animating while true.) */
  busy(now: number): boolean;
}

/** The mid-Run banner when a Skin unlocks. */
export const SKIN_UNLOCKED_TEXT = "New Skin unlocked!";

export function directFeedback(events: readonly GameEvent[]): FeedbackCue[] {
  const cues: FeedbackCue[] = [];
  let vibration: readonly number[] | null = null;
  const boardClear = events.some((e) => e.type === "boardClear");
  for (const event of events) {
    for (const sound of soundsFor(event)) cues.push({ kind: "sound", sound });
    vibration = vibrationFor(event) ?? vibration;
    switch (event.type) {
      case "linesCleared": {
        // `multiplier` is the Combo level after this Clear's increment.
        const tier = praiseTier(event.lines, event.multiplier);
        cues.push({ kind: "praise", text: PRAISE[tier]!.text, tier });
        cues.push({ kind: "burst", cells: event.cells, big: boardClear });
        cues.push({
          kind: "shake",
          magnitude: shakeMagnitude({ lines: event.lines, combo: event.multiplier, boardClear }),
          durationMs: boardClear ? CLEAR_SHAKE.boardClearDurationMs : CLEAR_SHAKE.durationMs,
        });
        break;
      }
      case "boardClear":
        cues.push({ kind: "boardFlash" });
        break;
      case "comboIncreased":
        if (event.level >= COMBO_DISPLAY_FROM) cues.push({ kind: "combo", level: event.level });
        break;
      case "comboBroken":
        if (event.level >= COMBO_DISPLAY_FROM) cues.push({ kind: "comboEnd", level: event.level });
        break;
      case "newBest":
        cues.push({ kind: "newBest", score: event.score });
        break;
      case "skinUnlocked":
        cues.push({ kind: "skinUnlocked", skin: event.skin, text: SKIN_UNLOCKED_TEXT });
        break;
    }
  }
  if (vibration) cues.push({ kind: "haptic", pattern: vibration });
  return cues;
}
