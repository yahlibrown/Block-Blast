// Sound and vibration mapping used by the feedback director (`director.ts`):
// which sounds a core event plays, and which vibration pattern it calls for.
// Pure (no audio, no navigator). Tested through `directFeedback`.
//
// Feel constants (pitches, vibration ms) live here next to the feedback code,
// not in TUNING, which is for core balance numbers.
import type { GameEvent } from "../core";
import type { Sound } from "../audio/audio";

/** Combo level 1's chime: C5. */
const CHIME_BASE_HZ = 523.25;
/** Major-pentatonic steps in semitones; each Combo step climbs one, wrapping up an octave. */
const PENTATONIC = [0, 2, 4, 7, 9] as const;

/** Chime pitch for a Combo level (1, 2, …): strictly rising, always in key. */
export function chimeFrequency(level: number): number {
  const step = Math.max(0, level - 1);
  const semitones = 12 * Math.floor(step / PENTATONIC.length) + PENTATONIC[step % PENTATONIC.length];
  return CHIME_BASE_HZ * 2 ** (semitones / 12);
}

/** A light tap on every Placement. */
const PLACEMENT_VIBRATION: readonly number[] = [15];
/** Clear patterns by Multi-Clear size (index 0 = 1 Line); bigger sizes reuse the last + extra pulses. */
const CLEAR_VIBRATION: readonly (readonly number[])[] = [
  [35],
  [45, 40, 45],
  [55, 40, 55, 40, 70],
];
const EXTRA_PULSE = [40, 70] as const;
/** Board Clear: a long rolling buzz, stronger than any Clear. */
const BOARD_CLEAR_VIBRATION: readonly number[] = [60, 40, 60, 40, 60, 60, 400];

function clearVibration(lines: number): readonly number[] {
  const index = Math.min(lines, CLEAR_VIBRATION.length) - 1;
  const pattern = [...CLEAR_VIBRATION[Math.max(0, index)]];
  for (let extra = CLEAR_VIBRATION.length; extra < lines; extra++) pattern.push(...EXTRA_PULSE);
  return pattern;
}

/** The sounds one core event plays, in order. */
export function soundsFor(event: GameEvent): Sound[] {
  switch (event.type) {
    case "piecePlaced":
      return [{ kind: "thunk" }];
    case "linesCleared":
      return [{ kind: "clear", lines: event.lines }];
    case "comboIncreased":
      return [{ kind: "chime", level: event.level, frequency: chimeFrequency(event.level) }];
    case "boardClear":
      return [{ kind: "boardClear" }];
    default:
      return [];
  }
}

/**
 * The vibration a core event calls for, or null. A Placement fires one pattern
 * (a new `navigator.vibrate` cancels the last), so the director keeps the last
 * non-null one: Board Clear beats Clear beats the landing tap.
 */
export function vibrationFor(event: GameEvent): readonly number[] | null {
  switch (event.type) {
    case "piecePlaced":
      return PLACEMENT_VIBRATION;
    case "linesCleared":
      return clearVibration(event.lines);
    case "boardClear":
      return BOARD_CLEAR_VIBRATION;
    default:
      return null;
  }
}
