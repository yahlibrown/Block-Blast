// Text overlay: plays the director's text cues (Praise and its Combo Pop, NEW BEST!,
// New Skin) as timed pops. Nothing stays on the Board: the Combo Pop lives and fades
// with the Praise it came with (the lasting Combo level is the HUD's Combo Tag).
// Pure and time-driven: the shell passes `now` (rAF time, ms) and hands
// `frame(now)` to the renderer, which draws it over the Board.
// It's drawn on the canvas and owns no input, so it never blocks a drag.
import type { CuePlayer, FeedbackCue } from "./director";

export type PopRole = "praise" | "comboPop" | "newBest" | "skinUnlocked";

/** One text to draw this frame. The renderer decides where each role sits and its look. */
export interface PopFrame {
  readonly role: PopRole;
  readonly text: string;
  /** Praise strength 0..4 (0 for other roles); the renderer may size/color by it. */
  readonly tier: number;
  /** Size multiplier (1 = resting size). */
  readonly scale: number;
  /** Opacity 0..1. */
  readonly alpha: number;
  /** Upward drift so far, as a fraction of one Cell. */
  readonly rise: number;
}

export interface TextOverlay extends CuePlayer {
  play(cues: readonly FeedbackCue[], now: number): void;
  frame(now: number): PopFrame[];
}

/** Timings in ms. UI feel constants, not core balance. */
const PRAISE_MS = 1000;
const PRAISE_MS_PER_TIER = 150;
const POP_IN_MS = 180;
const FADE_OUT_MS = 350;
const NEW_BEST_MS = 1600;
const NEW_BEST_POP_MS = 280;
const SKIN_BANNER_MS = 2400;
const SKIN_BANNER_POP_MS = 320;

interface Timed {
  readonly text: string;
  readonly tier: number;
  readonly start: number;
  readonly life: number;
}

/** A Praise, with the Combo level of its Combo Pop (null: no Pop). */
interface PraiseTimed extends Timed {
  readonly comboLevel: number | null;
}

export function createTextOverlay(): TextOverlay {
  let praise: PraiseTimed | null = null;
  let newBest: Timed | null = null;
  let skin: Timed | null = null;

  return {
    play(cues, now) {
      // A Combo increase comes with the same Placement's Praise, in either order.
      const comboLevel = cues.find((c) => c.kind === "combo")?.level ?? null;
      for (const cue of cues) {
        switch (cue.kind) {
          case "praise":
            praise = {
              text: cue.text,
              tier: cue.tier,
              start: now,
              life: PRAISE_MS + cue.tier * PRAISE_MS_PER_TIER,
              comboLevel,
            };
            break;
          case "newBest":
            newBest = { text: "NEW BEST!", tier: 0, start: now, life: NEW_BEST_MS };
            break;
          case "skinUnlocked":
            skin = { text: cue.text, tier: 0, start: now, life: SKIN_BANNER_MS };
            break;
        }
      }
    },
    reset() {
      praise = newBest = skin = null;
    },
    frame(now) {
      const frames: PopFrame[] = [];
      if (praise) {
        const f = popFrame("praise", praise, now, POP_IN_MS, 0.6);
        if (f) {
          frames.push(f);
          // The Combo Pop moves and fades with its Praise, so it never outstays it.
          if (praise.comboLevel !== null) {
            frames.push({ ...f, role: "comboPop", text: `COMBO ×${praise.comboLevel}`, tier: 0 });
          }
        }
      }
      if (newBest) {
        const f = popFrame("newBest", newBest, now, NEW_BEST_POP_MS, 0.3);
        if (f) frames.push(f);
      }
      if (skin) {
        const f = popFrame("skinUnlocked", skin, now, SKIN_BANNER_POP_MS, 0.2);
        if (f) frames.push(f);
      }
      return frames;
    },
    busy(now) {
      const live = (p: Timed | null) => p !== null && now - p.start < p.life;
      return live(praise) || live(newBest) || live(skin);
    },
  };
}

/** Pop in with an overshoot, hold, then fade out while drifting up `rise` Cells. */
function popFrame(role: PopRole, p: Timed, now: number, popMs: number, rise: number): PopFrame | null {
  const age = Math.max(0, now - p.start);
  if (age >= p.life) return null;
  const popIn = Math.min(1, age / popMs);
  const fadeLeft = p.life - age;
  return {
    role,
    text: p.text,
    tier: p.tier,
    scale: 0.3 + 0.7 * easeOutBack(popIn),
    alpha: Math.min(1, popIn * 2, fadeLeft / FADE_OUT_MS),
    rise: rise * (age / p.life),
  };
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
