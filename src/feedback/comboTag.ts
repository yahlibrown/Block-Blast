// Combo Tag: the small "×N" beside the score showing the current Combo level,
// kept off the Board. Pure and time-driven like the text overlay: the shell
// passes `now` (rAF time, ms) and the HUD draws `frame(now)`.
import type { CuePlayer, FeedbackCue } from "./director";
import { COMBO_DISPLAY_FROM } from "./praise";

/** What the HUD shows this frame. */
export interface ComboTagFrame {
  readonly level: number;
  /** Size multiplier (1 = resting size). */
  readonly scale: number;
  /** Opacity 0..1. */
  readonly alpha: number;
}

export interface ComboTag extends CuePlayer {
  play(cues: readonly FeedbackCue[], now: number): void;
  /** Show the Run's current Combo level at once, no bump (a resumed Run). */
  show(level: number): void;
  /** Null while the Tag is hidden. */
  frame(now: number): ComboTagFrame | null;
}

/** Timings in ms. UI feel constants, not core balance. */
const BUMP_MS = 260;
const FADE_MS = 500;

export function createComboTag(): ComboTag {
  let level = 0;
  let bumpStart = -Infinity;
  /** When the Combo broke (null: still alive). */
  let fadeStart: number | null = null;
  const hidden = (now: number) => level === 0 || (fadeStart !== null && now - fadeStart >= FADE_MS);

  return {
    play(cues, now) {
      for (const cue of cues) {
        if (cue.kind === "combo") {
          level = cue.level;
          bumpStart = now;
          fadeStart = null;
        } else if (cue.kind === "comboEnd" && fadeStart === null) {
          fadeStart = now;
        }
      }
    },
    show(next) {
      level = next >= COMBO_DISPLAY_FROM ? next : 0;
      bumpStart = -Infinity;
      fadeStart = null;
    },
    reset() {
      level = 0;
      fadeStart = null;
    },
    frame(now) {
      if (hidden(now)) return null;
      const t = Math.max(0, now - bumpStart) / BUMP_MS;
      const alpha = fadeStart === null ? 1 : 1 - Math.max(0, now - fadeStart) / FADE_MS;
      return { level, scale: t < 1 ? 1 + 0.35 * Math.sin(Math.PI * t) : 1, alpha };
    },
    busy(now) {
      return !hidden(now) && (now - bumpStart < BUMP_MS || fadeStart !== null);
    },
  };
}
