// "Turn your phone upright" screen: iPhones ignore the manifest's portrait lock, so when the
// device facts say a phone is sideways this covers everything (Board, Tray, settings, Game Over)
// and swallows input underneath; while shown, everything else on the page is `inert`, so focus and
// screen readers can't reach it either. It never touches the Run: hiding it shows the game as it was.

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

  /** The elements this screen made inert (and only those: anything already inert stays so). */
  let madeInert: HTMLElement[] = [];

  return {
    show() {
      overlay.hidden = false;
      for (const el of Array.from(parent.children)) {
        if (el === overlay || !(el instanceof HTMLElement) || el.inert) continue;
        el.inert = true;
        madeInert.push(el);
      }
    },
    hide() {
      overlay.hidden = true;
      for (const el of madeInert) el.inert = false;
      madeInert = [];
    },
  };
}
