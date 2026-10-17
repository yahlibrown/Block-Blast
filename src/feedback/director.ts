// Feedback director: turns one Placement's core events into feedback cues.
// Pure: it decides *what* the player gets (which Praise, which display); the
// shell plays the cues (text pops; sound and haptic cues from `sensory.ts`).
//
// Extending (tickets 10, 11, …): add members to `FeedbackCue` and push them from
// the matching event's case below. Cues come out in event order, and players
// switch on `kind` and ignore kinds they don't handle, so a new kind never
// breaks an existing player.
import type { GameEvent } from "../core";
import type { Sound } from "../audio/audio";
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
  /** Play a generated sound (see `audio`). */
  | { readonly kind: "sound"; readonly sound: Sound }
  /** Vibrate with this pattern (ms on, off, on, ...). At most one per Placement, last. */
  | { readonly kind: "haptic"; readonly pattern: readonly number[] };

export type FeedbackCueKind = FeedbackCue["kind"];

export function directFeedback(events: readonly GameEvent[]): FeedbackCue[] {
  const cues: FeedbackCue[] = [];
  let vibration: readonly number[] | null = null;
  for (const event of events) {
    for (const sound of soundsFor(event)) cues.push({ kind: "sound", sound });
    vibration = vibrationFor(event) ?? vibration;
    switch (event.type) {
      case "linesCleared": {
        // `multiplier` is the Combo level after this Clear's increment.
        const tier = praiseTier(event.lines, event.multiplier);
        cues.push({ kind: "praise", text: PRAISE[tier]!.text, tier });
        break;
      }
      case "comboIncreased":
        if (event.level >= COMBO_DISPLAY_FROM) cues.push({ kind: "combo", level: event.level });
        break;
      case "comboBroken":
        if (event.level >= COMBO_DISPLAY_FROM) cues.push({ kind: "comboEnd", level: event.level });
        break;
      case "newBest":
        cues.push({ kind: "newBest", score: event.score });
        break;
    }
  }
  if (vibration) cues.push({ kind: "haptic", pattern: vibration });
  return cues;
}
