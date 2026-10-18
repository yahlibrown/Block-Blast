// Settings: a gear button in the HUD band that opens a small bottom sheet.
// The sheet starts empty; features add their own rows:
//   - `addToggle(label, initial, onChange)` for on/off switches (sound, haptics),
//   - or append any element to `content` (ticket 13: the Skin picker).
// Toggles take effect immediately through their `onChange`; saving is the caller's job.
import { SCROLLABLE_CLASS, TAPPABLE_CLASS } from "../input/touchGuard";

export interface Toggle {
  /** Reflect a value changed elsewhere (does not call `onChange`). */
  set(value: boolean): void;
}

export interface SettingsSheet {
  /** The sheet's body, for rows that aren't simple toggles. */
  readonly content: HTMLElement;
  addToggle(label: string, initial: boolean, onChange: (value: boolean) => void): Toggle;
  open(): void;
  close(): void;
  readonly visible: boolean;
}

const GEAR_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor">
  <path d="M19.14 12.94a7.5 7.5 0 0 0 .05-.94 7.5 7.5 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.84a.5.5 0 0 0-.49.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.67 8.48a.5.5 0 0 0 .12.64l2.03 1.58a7.4 7.4 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.61.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.49-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96c.22.08.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
</svg>`;

export function createSettingsSheet(parent: HTMLElement): SettingsSheet {
  const gear = document.createElement("button");
  gear.type = "button";
  gear.className = "settings-gear";
  gear.setAttribute("aria-label", "Settings");
  gear.innerHTML = GEAR_SVG;

  const overlay = document.createElement("div");
  overlay.className = `settings ${TAPPABLE_CLASS}`; // tapping the dimmed area closes it
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "settings-title");

  const panel = document.createElement("div");
  panel.className = `settings__panel ${SCROLLABLE_CLASS}`;

  const title = document.createElement("h2");
  title.id = "settings-title";
  title.className = "settings__title";
  title.textContent = "Settings";

  const content = document.createElement("div");
  content.className = "settings__content";

  const done = document.createElement("button");
  done.type = "button";
  done.className = "settings__done";
  done.textContent = "Done";

  panel.append(title, content, done);
  overlay.append(panel);
  parent.append(gear, overlay);

  const sheet: SettingsSheet = {
    content,
    addToggle(label, initial, onChange) {
      const row = document.createElement("label");
      row.className = "settings__toggle";
      const text = document.createElement("span");
      text.textContent = label;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.checked = initial;
      input.addEventListener("change", () => onChange(input.checked));
      row.append(text, input);
      content.append(row);
      return {
        set(value) {
          input.checked = value;
        },
      };
    },
    open() {
      overlay.hidden = false;
      done.focus();
    },
    close() {
      overlay.hidden = true;
      gear.focus();
    },
    get visible() {
      return !overlay.hidden;
    },
  };

  gear.addEventListener("click", () => sheet.open());
  done.addEventListener("click", () => sheet.close());
  // Tapping the dimmed area outside the panel closes the sheet.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) sheet.close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.visible) sheet.close();
  });

  return sheet;
}
