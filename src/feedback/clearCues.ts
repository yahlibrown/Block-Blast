// Clear effect cues: how hard a Clear hits. The director decides the size of the moment
// (burst, shake strength, Board Clear flash); the effects player only animates it.
// UI feel numbers, not core balance, so they live here rather than in TUNING.
import type { GameEvent } from "../core";

/** Screen shake per Clear, in Board Cells / ms. */
export const CLEAR_SHAKE = {
  /** Amplitude: base + perExtraLine × (Lines − 1) + perComboLevel × (Combo − 1), capped at max. */
  base: 0.08,
  perExtraLine: 0.07,
  perComboLevel: 0.03,
  max: 0.45,
  durationMs: 320,
  /** A Board Clear shakes at max + boardClearBonus, for longer. */
  boardClearBonus: 0.3,
  boardClearDurationMs: 900,
} as const;

/** A cleared Cell with the color it had, for the flash and its particles. */
export type ClearedCell = Extract<GameEvent, { type: "linesCleared" }>["cells"][number];

export interface ShakeInput {
  /** Lines in the Clear (Multi-Clear size). */
  readonly lines: number;
  /** Combo level after this Clear (1 on the first Clear of a streak). */
  readonly combo: number;
  readonly boardClear: boolean;
}

/** Shake amplitude in Cells for one Clear. */
export function shakeMagnitude({ lines, combo, boardClear }: ShakeInput): number {
  const s = CLEAR_SHAKE;
  // A Board Clear always beats the ordinary cap: it's the rarest, loudest moment.
  if (boardClear) return s.max + s.boardClearBonus;
  const amp = s.base + s.perExtraLine * Math.max(0, lines - 1) + s.perComboLevel * Math.max(0, combo - 1);
  return Math.min(s.max, amp);
}
