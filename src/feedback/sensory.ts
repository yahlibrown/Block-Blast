// Sensory cues: which sounds to play and which vibration to fire for the core
// events of one Placement. Pure (no audio, no navigator), so it's unit-tested;
// the shell hands the result to `audio` and `haptics`.
//
// Standalone for now: ticket 09's feedback director is expected to fold this
// into its cue output (events → Praise, particles, shake, sounds, vibration).
//
// Feel constants (pitches, vibration ms) live here next to the feedback code,
// not in TUNING, which is for core balance numbers.
import type { GameEvent } from "../core";
import type { Sound } from "../audio/audio";

/** Sound cues are the audio module's sound vocabulary. */
export type SoundCue = Sound;

export interface SensoryCues {
  /** Sounds to start together, in order. */
  readonly sounds: readonly SoundCue[];
  /** One vibration pattern (ms on, off, on, …) for the whole Placement, or null. */
  readonly vibration: readonly number[] | null;
}

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

export function sensoryCues(events: readonly GameEvent[]): SensoryCues {
  const sounds: SoundCue[] = [];
  let vibration: readonly number[] | null = null;
  for (const event of events) {
    switch (event.type) {
      case "piecePlaced":
        sounds.push({ kind: "thunk" });
        vibration = PLACEMENT_VIBRATION;
        break;
      case "linesCleared":
        sounds.push({ kind: "clear", lines: event.lines });
        vibration = clearVibration(event.lines);
        break;
      case "comboIncreased":
        sounds.push({ kind: "chime", level: event.level, frequency: chimeFrequency(event.level) });
        break;
      case "boardClear":
        sounds.push({ kind: "boardClear" });
        vibration = BOARD_CLEAR_VIBRATION;
        break;
    }
  }
  return { sounds, vibration };
}
