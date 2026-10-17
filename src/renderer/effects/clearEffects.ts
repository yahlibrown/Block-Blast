// Clear effects simulation (ticket 10): Line flash, block particles, screen shake, Board Clear
// celebration. Pure: no DOM, no timers. Driven by core Placement events and the frame loop's `now`.
// Positions/lengths are in Board Cells so the drawing code can scale them to any layout.
//
// NOTE for review: ticket 09's feedback director (`src/feedback/`) is meant to own "core events →
// particles/shake". This module is driven straight from `shell/main.ts` for now; the director can
// later call `onPlacement` itself (the interface takes plain core events).
import type { GameEvent } from "../../core";
import { TUNING } from "../../tuning/tuning";

const FX = TUNING.effects;

export interface ShakeInput {
  /** Lines in the Clear (Multi-Clear size). */
  readonly lines: number;
  /** Combo level after this Clear (1 on the first Clear of a streak). */
  readonly combo: number;
  readonly boardClear: boolean;
}

/** Shake amplitude in Cells for one Clear. */
export function shakeMagnitude({ lines, combo, boardClear }: ShakeInput): number {
  const s = FX.shake;
  const base =
    s.base + s.perExtraLine * Math.max(0, lines - 1) + s.perComboLevel * Math.max(0, combo - 1);
  // A Board Clear always beats the ordinary cap: it's the rarest, loudest moment.
  return boardClear ? s.max + FX.boardClear.shakeBonus : Math.min(s.max, base);
}

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

export interface ClearEffects {
  /** Feed every Placement's core events; starts effects for a Clear and ignores everything else. */
  onPlacement(events: readonly GameEvent[], now: number): void;
  /** True while anything is still playing at `now` (use it as the frame loop's animation step). */
  active(now: number): boolean;
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
  const B = FX.boardClear;
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
    onPlacement(events, now) {
      const cleared = events.find((e) => e.type === "linesCleared");
      if (!cleared) return;
      const comboEvent = events.find((e) => e.type === "comboIncreased");
      const combo = comboEvent ? comboEvent.level : 1;
      const isBoardClear = events.some((e) => e.type === "boardClear");

      const burstAt = now + FX.flashMs;
      flashes.push({ start: now, end: burstAt, cells: cleared.cells });
      const perBlock = Math.round(P.perBlock * (isBoardClear ? B.particleMultiplier : 1));
      for (const cell of cleared.cells) {
        spawn(cell, burstAt, perBlock, isBoardClear ? B.speedMultiplier : 1);
      }
      // Over the cap: drop the oldest particles (keeps a big Multi-Clear cheap on the phone).
      if (particles.length > P.max) particles = particles.slice(particles.length - P.max);

      const amp = shakeMagnitude({ lines: cleared.lines, combo, boardClear: isBoardClear });
      const shakeMs = isBoardClear ? B.shakeDurationMs : FX.shake.durationMs;
      shakes.push({ start: now, end: now + shakeMs, amp });
      if (isBoardClear) boardFlashes.push({ start: now, end: now + B.flashMs });
    },

    active(now) {
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
