// Score HUD: the current score and Best Score, shown above the Board during play,
// plus the same pair as rows on the Game Over screen.
// Plain DOM in a band above the canvas, so the renderer's layout is untouched.
// The play HUD's score rolls up to each new value (ticket 09 count-up).
import type { GameState } from "../core";
import { createCountUp } from "../feedback/countUp";
import type { ComboTagFrame } from "../feedback/comboTag";

export interface Hud {
  update(state: GameState): void;
}

/** The play HUD: `update` starts a roll; the frame loop calls `tick` until it returns false. */
export interface LiveHud {
  /** Roll the shown score up to `state.score`, starting at `now` (rAF time base). */
  update(state: GameState, now: number): void;
  /** Show `state` at once, no roll (startup, new Run). */
  reset(state: GameState): void;
  /** Write the value shown at `now`; false once the roll has landed. */
  tick(now: number): boolean;
  /** Draw the Combo Tag beside the score (null hides it). */
  comboTag(frame: ComboTagFrame | null): void;
}

export function createHud(parent: HTMLElement, before: Element): LiveHud {
  const root = document.createElement("div");
  root.id = "hud";
  root.innerHTML = `
    <div class="hud-score"><span class="hud-label">Score</span><span class="hud-value" data-score>0</span><span class="hud-combo" data-combo hidden></span></div>
    <div class="hud-best"><span class="hud-label">Best</span><span class="hud-value" data-best>0</span></div>
  `;
  parent.insertBefore(root, before);
  const score = root.querySelector<HTMLElement>("[data-score]")!;
  const best = root.querySelector<HTMLElement>("[data-best]")!;
  const combo = root.querySelector<HTMLElement>("[data-combo]")!;
  const shown = createCountUp(0);
  let current: GameState | null = null;

  const write = (now: number) => {
    if (!current) return;
    const value = shown.value(now);
    score.textContent = formatScore(value);
    // While the score is the Best Score, the Best rolls up with it instead of jumping ahead.
    const bestShown = current.best > current.score ? current.best : Math.max(current.runStartBest, value);
    best.textContent = formatScore(bestShown);
  };

  return {
    update(state, now) {
      current = state;
      shown.to(state.score, now);
      write(now);
    },
    reset(state) {
      current = state;
      shown.set(state.score);
      write(0);
    },
    tick(now) {
      write(now);
      return !shown.done(now);
    },
    comboTag(frame) {
      combo.hidden = frame === null;
      if (!frame) return;
      combo.textContent = `×${frame.level}`;
      combo.style.opacity = String(frame.alpha);
      combo.style.transform = `scale(${frame.scale})`;
    },
  };
}

/** Score and Best Score rows for the Game Over screen's `stats` container. */
export function createScoreStats(container: HTMLElement): Hud {
  const rows = document.createElement("div");
  rows.className = "score-stats";
  rows.innerHTML = `
    <div class="score-stats__row"><span class="hud-label">Score</span><span class="score-stats__value" data-score>0</span></div>
    <div class="score-stats__row score-stats__row--best"><span class="hud-label">Best</span><span class="score-stats__value" data-best>0</span></div>
  `;
  container.append(rows);
  const score = rows.querySelector<HTMLElement>("[data-score]")!;
  const best = rows.querySelector<HTMLElement>("[data-best]")!;
  return {
    update(state) {
      score.textContent = formatScore(state.score);
      best.textContent = formatScore(state.best);
    },
  };
}

export function formatScore(points: number): string {
  return points.toLocaleString("en-US");
}
