// Game Over screen: a DOM overlay over the Board with a big "Play again" button.
// `stats` is an empty container for later tickets (score and Best Score in 05/09,
// Skin progress in 13): they append their own rows to it before calling `show`.
// `below` sits under "Play again" (the Home Screen Hint), so nothing there ever
// pushes "Play again" down or covers it.

export interface GameOverScreen {
  /** Where later tickets put score, Best Score and Skin progress. */
  readonly stats: HTMLElement;
  /** Under "Play again": for extras that must never cover or displace it. */
  readonly below: HTMLElement;
  show(): void;
  /** Give "Play again" the focus again (e.g. after a card under it is dismissed). */
  focusPlayAgain(): void;
  hide(): void;
  readonly visible: boolean;
}

export function createGameOverScreen(
  parent: HTMLElement,
  onPlayAgain: () => void,
): GameOverScreen {
  const overlay = document.createElement("div");
  overlay.className = "game-over";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "game-over-title");

  const panel = document.createElement("div");
  panel.className = "game-over__panel";

  const title = document.createElement("h1");
  title.id = "game-over-title";
  title.className = "game-over__title";
  title.textContent = "Game Over";

  const stats = document.createElement("div");
  stats.className = "game-over__stats";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-over__play";
  button.textContent = "Play again";
  button.addEventListener("click", () => onPlayAgain());

  const below = document.createElement("div");
  below.className = "game-over__below";

  panel.append(title, stats, button, below);
  overlay.append(panel);
  parent.append(overlay);

  return {
    stats,
    below,
    show() {
      overlay.hidden = false;
      button.focus();
    },
    focusPlayAgain() {
      button.focus();
    },
    hide() {
      overlay.hidden = true;
    },
    get visible() {
      return !overlay.hidden;
    },
  };
}
