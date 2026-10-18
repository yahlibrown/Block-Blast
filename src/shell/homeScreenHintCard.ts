// Home Screen Hint card (DOM): sits under "Play again" on the Game Over screen and
// tells iPhone players in a Safari tab how to add the game to their Home Screen.
// Whether it shows is the Home Screen Hint rule's call (persistence/homeScreenHint).
// The copy never promises that progress carries over: iOS keeps the Home Screen
// app's data apart from Safari's.

export interface HomeScreenHintCard {
  /** Show or hide the card (call before showing the Game Over screen). */
  update(shown: boolean): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function createHomeScreenHintCard(parent: HTMLElement, onDismiss: () => void): HomeScreenHintCard {
  const card = document.createElement("aside");
  card.className = "home-hint";
  card.hidden = true;
  card.setAttribute("aria-label", "Home Screen Hint");

  const text = document.createElement("div");
  text.className = "home-hint__text";

  const title = document.createElement("p");
  title.className = "home-hint__title";
  title.textContent = "Add to Home Screen to keep your Best";

  const steps = document.createElement("p");
  steps.className = "home-hint__steps";
  steps.append("Tap ", shareIcon(), " Share, then ");
  const step = document.createElement("strong");
  step.textContent = "Add to Home Screen";
  steps.append(step, ".");

  text.append(title, steps);

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "home-hint__dismiss";
  dismiss.setAttribute("aria-label", "Dismiss");
  dismiss.textContent = "×";
  dismiss.addEventListener("click", () => {
    card.hidden = true;
    onDismiss();
  });

  card.append(text, dismiss);
  parent.append(card);

  return {
    update(shown) {
      card.hidden = !shown;
    },
  };
}

/** iOS's Share glyph: a box with an arrow pointing up out of it. */
function shareIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "home-hint__share");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M12 3v12M8 7l4-4 4 4M8 10H6v11h12V10h-2");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}
