// "Turn your phone upright" screen: iPhones ignore the manifest's portrait lock, so when the
// device facts say a phone is sideways this covers everything (Board, Tray, settings, Game Over)
// and swallows input underneath. It never touches the Run: hiding it shows the game as it was.

export interface UprightScreen {
  show(): void;
  hide(): void;
}

export function createUprightScreen(parent: HTMLElement): UprightScreen {
  const overlay = document.createElement("div");
  overlay.className = "upright";
  overlay.hidden = true;
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "upright-title");

  const icon = document.createElement("div");
  icon.className = "upright__phone";
  icon.setAttribute("aria-hidden", "true");

  const title = document.createElement("p");
  title.id = "upright-title";
  title.className = "upright__title";
  title.textContent = "Turn your phone upright";

  overlay.append(icon, title);
  parent.append(overlay);

  return {
    show() {
      overlay.hidden = false;
    },
    hide() {
      overlay.hidden = true;
    },
  };
}
