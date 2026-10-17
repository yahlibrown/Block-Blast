// Score HUD: the current score and Best Score, shown above the Board during play,
// plus the same pair as rows on the Game Over screen.
// Plain DOM in a band above the canvas, so the renderer's layout is untouched.
// (Ticket 09 replaces the instant update with a count-up.)
import type { GameState } from "../core";

export interface Hud {
  update(state: GameState): void;
}

export function createHud(parent: HTMLElement, before: Element): Hud {
  const root = document.createElement("div");
  root.id = "hud";
  root.innerHTML = `
    <div class="hud-score"><span class="hud-label">Score</span><span class="hud-value" data-score>0</span></div>
    <div class="hud-best"><span class="hud-label">Best</span><span class="hud-value" data-best>0</span></div>
  `;
  parent.insertBefore(root, before);
  const score = root.querySelector<HTMLElement>("[data-score]")!;
  const best = root.querySelector<HTMLElement>("[data-best]")!;
  return {
    update(state) {
      score.textContent = formatScore(state.score);
      best.textContent = formatScore(state.best);
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
