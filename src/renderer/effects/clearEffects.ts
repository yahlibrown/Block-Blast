// Clear effects player (ticket 10): Line flash, block particles, screen shake, Board Clear
// celebration. Pure: no DOM, no timers, no game rules. It plays the feedback director's
// `burst` / `shake` / `boardFlash` cues against the frame loop's `now`.
// Positions/lengths are in Board Cells so the drawing code can scale them to any layout.
import type { CuePlayer, FeedbackCue } from "../../feedback/director";
import { EFFECTS as FX } from "./effectsTuning";

export interface FlashCell {
  readonly row: number;
  readonly col: number;
  readonly color: number;
}

/** One live particle, in Board Cell units (x = column, y = row; 0,0 = Board top-left). */
export interface ParticleView {
  x: number;
  y: number;
  color: number;
  /** 1 when born, fading to 0. */
  alpha: number;
  /** Side length in Cells. */
  size: number;
}

export interface EffectsFrame {
  /** Cleared Cells still flashing (drawn in their old color + white wash), before they burst. */
  readonly flash: readonly FlashCell[];
  /** 0..1 strength of the white wash over the flashing Cells. */
  readonly flashStrength: number;
  /** Reused between frames: read them during this frame only. */
  readonly particles: readonly ParticleView[];
  /** Board offset this frame, in Cells. */
  readonly shake: { readonly x: number; readonly y: number };
  /** 0..1 opacity of the full-Board white flash (Board Clear only). */
  readonly boardFlash: number;
}

export interface ClearEffects extends CuePlayer {
  /** Starts the effect cues (`burst`, `shake`, `boardFlash`); ignores every other kind. */
  play(cues: readonly FeedbackCue[], now: number): void;
  /** What to draw at `now` (`now` must not go backwards). */
  frame(now: number): EffectsFrame;
}

interface Particle {
  readonly x0: number;
  readonly y0: number;
  readonly vx: number;
  readonly vy: number;
  readonly color: number;
  readonly born: number;
  readonly size: number;
}

interface Timed {
  readonly start: number;
  readonly end: number;
}

/** `random` returns [0, 1) like Math.random; inject a fixed one in tests. */
export function createClearEffects(random: () => number = Math.random): ClearEffects {
  const P = FX.particles;
  const B = FX.big;
  let particles: Particle[] = [];
  let flashes: (Timed & { readonly cells: readonly FlashCell[] })[] = [];
  let shakes: (Timed & { readonly amp: number })[] = [];
  let boardFlashes: Timed[] = [];
  const pool: ParticleView[] = [];
  const out: ParticleView[] = [];
  const running = (now: number) => (t: Timed) => now < t.end;
  const alive = (now: number) => (p: Particle) => now < p.born + P.lifeMs;

  function spawn(cell: FlashCell, born: number, count: number, speedMul: number): void {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const speed = P.speed * speedMul * (0.4 + random() * 0.8);
      particles.push({
        x0: cell.col + 0.2 + random() * 0.6,
        y0: cell.row + 0.2 + random() * 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - P.speed * speedMul * 0.5, // a little upward pop
        color: cell.color,
        born,
        size: P.size * (0.6 + random() * 0.8),
      });
    }
  }

  return {
    play(cues, now) {
      for (const cue of cues) {
        switch (cue.kind) {
          case "burst": {
            const burstAt = now + FX.flashMs;
            flashes.push({ start: now, end: burstAt, cells: cue.cells });
            const perBlock = Math.round(P.perBlock * (cue.big ? B.particleMultiplier : 1));
            for (const cell of cue.cells) spawn(cell, burstAt, perBlock, cue.big ? B.speedMultiplier : 1);
            // Over the cap: drop the oldest particles (keeps a big Multi-Clear cheap on the phone).
            if (particles.length > P.max) particles = particles.slice(particles.length - P.max);
            break;
          }
          case "shake":
            shakes.push({ start: now, end: now + cue.durationMs, amp: cue.magnitude });
            break;
          case "boardFlash":
            boardFlashes.push({ start: now, end: now + FX.boardFlashMs });
            break;
        }
      }
    },

    reset() {
      particles = [];
      flashes = [];
      shakes = [];
      boardFlashes = [];
    },

    busy(now) {
      return (
        flashes.some(running(now)) ||
        shakes.some(running(now)) ||
        boardFlashes.some(running(now)) ||
        particles.some(alive(now))
      );
    },

    frame(now) {
      flashes = flashes.filter(running(now));
      shakes = shakes.filter(running(now));
      boardFlashes = boardFlashes.filter(running(now));
      particles = particles.filter(alive(now));

      const flash: FlashCell[] = [];
      let flashStrength = 0;
      for (const f of flashes) {
        flash.push(...f.cells);
        flashStrength = Math.max(flashStrength, clamp01((now - f.start) / FX.flashMs));
      }

      // Motion is closed-form in time, so a dropped frame never makes particles stutter or drift.
      out.length = 0;
      for (const p of particles) {
        if (now < p.born) continue;
        const t = (now - p.born) / 1000;
        const view = pool[out.length] ?? { x: 0, y: 0, color: 0, alpha: 0, size: 0 };
        pool[out.length] = view;
        view.x = p.x0 + p.vx * t;
        view.y = p.y0 + p.vy * t + 0.5 * P.gravity * t * t;
        view.color = p.color;
        view.alpha = 1 - (now - p.born) / P.lifeMs;
        view.size = p.size;
        out.push(view);
      }

      // The strongest active shake wins, decaying quadratically, in a random direction each frame.
      let amp = 0;
      for (const s of shakes) {
        const left = clamp01(1 - (now - s.start) / (s.end - s.start));
        amp = Math.max(amp, s.amp * left * left);
      }
      const angle = random() * Math.PI * 2;
      const shake = amp > 0 ? { x: Math.cos(angle) * amp, y: Math.sin(angle) * amp } : { x: 0, y: 0 };

      let boardFlash = 0;
      for (const b of boardFlashes) {
        boardFlash = Math.max(boardFlash, clamp01(1 - (now - b.start) / (b.end - b.start)));
      }

      return { flash, flashStrength, particles: out, shake, boardFlash };
    },
  };
}

/** The rAF `now` can trail the `performance.now()` an effect started at by a fraction of a frame. */
function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
