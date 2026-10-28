// Home Screen Hint card (DOM): sits under "Play again" on the Game Over screen and
// tells iPhone players in a Safari tab how to add the game to their Home Screen.
// Whether it shows is the Home Screen Hint rule's call (persistence/homeScreenHint).
// The copy never promises that progress carries over: iOS keeps the Home Screen
// app's data apart from Safari's. The steps come from device/homeScreenSteps.

import type { HomeScreenStep, StepIcon } from "../device/homeScreenSteps";

export interface HomeScreenHintCard {
  /** Show or hide the card (call before showing the Game Over screen). */
  update(shown: boolean): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function createHomeScreenHintCard(
  parent: HTMLElement,
  stepList: readonly HomeScreenStep[],
  onDismiss: () => void,
): HomeScreenHintCard {
  const card = document.createElement("aside");
  card.className = "home-hint";
  card.hidden = true;
  card.setAttribute("aria-label", "Home Screen Hint");

  const text = document.createElement("div");
  text.className = "home-hint__text";

  const title = document.createElement("p");
  title.className = "home-hint__title";
  title.textContent = "Add to Home Screen to keep your Best";

  const steps = document.createElement("ol");
  steps.className = "home-hint__steps";
  for (const step of stepList) {
    const item = document.createElement("li");
    if (step.icon) item.append(stepIcon(step.icon), " ");
    const label = document.createElement(step.icon === "add" ? "strong" : "span");
    label.textContent = step.label;
    item.append(label);
    steps.append(item);
  }

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

/** Each step's glyph, drawn like Safari's: the address bar's menu button (two long lines, a short one on the right), Share (a box with an arrow out of it), and a plus in a square. */
const ICON_PATHS: Record<StepIcon, string> = {
  menu: "M4 7h16M4 12h16M10 17h10",
  share: "M12 3v12M8 7l4-4 4 4M8 10H6v11h12V10h-2",
  add: "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3M12 8v8M8 12h8",
};

function stepIcon(icon: StepIcon): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "home-hint__icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", ICON_PATHS[icon]);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}
