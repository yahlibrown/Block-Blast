// Score HUD: the current score and Best Score, shown above the Board during play.
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

export function formatScore(points: number): string {
  return points.toLocaleString("en-US");
}
