// Skin UI (DOM): the Skin picker for the settings sheet, and the Game Over rows
// (progress bar toward the next Skin + a reveal of Skins unlocked this Run).
import { skinProgress, SKINS, type GameState, type SkinId } from "../core";
import { skinLook, type SkinLook } from "../renderer/skins";
import { formatScore } from "./hud";

/** A tiny 2×2 preview of a Skin's Board and blocks. */
function swatch(look: SkinLook, big = false): HTMLElement {
  const el = document.createElement("span");
  el.className = `skin-swatch skin-swatch--${look.style}${big ? " skin-swatch--big" : ""}`;
  el.style.background = look.board;
  el.style.boxShadow = `0 0 12px ${look.backdrop.glow}66`;
  el.setAttribute("aria-hidden", "true");
  for (const color of [look.blocks[0], look.blocks[2], look.blocks[4], look.emptyCell]) {
    const block = document.createElement("span");
    block.style.setProperty("--block", color!);
    el.append(block);
  }
  return el;
}

export interface SkinPicker {
  /** Show which Skins are unlocked and which one is chosen. */
  update(unlocked: readonly SkinId[], chosen: SkinId): void;
}

/** Skin picker rows, appended to `container` (the settings sheet's content). */
export function createSkinPicker(container: HTMLElement, onChoose: (skin: SkinId) => void): SkinPicker {
  const section = document.createElement("div");
  section.className = "skin-picker";
  const heading = document.createElement("div");
  heading.className = "skin-picker__heading";
  heading.textContent = "Skin";
  const list = document.createElement("div");
  list.className = "skin-picker__list";
  list.setAttribute("role", "radiogroup");
  list.setAttribute("aria-label", "Skin");
  section.append(heading, list);
  container.append(section);

  const buttons = SKINS.map(({ id, threshold }) => {
    const look = skinLook(id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skin-option";
    button.setAttribute("role", "radio");
    const name = document.createElement("span");
    name.className = "skin-option__name";
    name.textContent = look.name;
    const lock = document.createElement("span");
    lock.className = "skin-option__lock";
    lock.textContent = `🔒 ${formatScore(threshold)}`;
    button.append(swatch(look), name, lock);
    button.addEventListener("click", () => {
      if (!button.disabled) onChoose(id);
    });
    list.append(button);
    return { id, threshold, button };
  });

  return {
    update(unlocked, chosen) {
      for (const { id, threshold, button } of buttons) {
        const open = unlocked.includes(id);
        button.disabled = !open;
        button.classList.toggle("skin-option--locked", !open);
        button.setAttribute("aria-checked", String(open && id === chosen));
        button.setAttribute(
          "aria-label",
          open ? skinLook(id).name : `${skinLook(id).name}, locked: unlocks at ${formatScore(threshold)} Lifetime Points`,
        );
      }
    },
  };
}

export interface SkinStats {
  update(state: GameState, chosen: SkinId): void;
}

/** Game Over rows: progress toward the next Skin, and a reveal of Skins unlocked this Run. */
export function createSkinStats(container: HTMLElement, onEquip: (skin: SkinId) => void): SkinStats {
  const root = document.createElement("div");
  root.className = "skin-stats";
  container.append(root);

  return {
    update(state, chosen) {
      root.replaceChildren();
      for (const id of state.runUnlocked) {
        const look = skinLook(id);
        const card = document.createElement("div");
        card.className = "skin-reveal";
        const label = document.createElement("div");
        label.className = "skin-reveal__label";
        label.textContent = "New Skin unlocked!";
        const name = document.createElement("div");
        name.className = "skin-reveal__name";
        name.textContent = look.name;
        const equip = document.createElement("button");
        equip.type = "button";
        equip.className = "skin-reveal__equip";
        const setEquipped = (on: boolean) => {
          equip.disabled = on;
          equip.textContent = on ? "Equipped" : "Use this Skin";
        };
        setEquipped(id === chosen);
        equip.addEventListener("click", () => {
          onEquip(id);
          for (const other of root.querySelectorAll<HTMLButtonElement>(".skin-reveal__equip")) {
            other.disabled = false;
            other.textContent = "Use this Skin";
          }
          setEquipped(true);
        });
        card.append(label, swatch(look, true), name, equip);
        root.append(card);
      }

      const { points, next, from } = skinProgress(state);
      const progress = document.createElement("div");
      progress.className = "skin-progress";
      const text = document.createElement("div");
      text.className = "skin-progress__text";
      const bar = document.createElement("div");
      bar.className = "skin-progress__bar";
      bar.setAttribute("role", "progressbar");
      const fill = document.createElement("div");
      fill.className = "skin-progress__fill";
      bar.append(fill);
      if (next) {
        const share = Math.min(1, Math.max(0, (points - from) / (next.threshold - from)));
        text.textContent = `Next Skin: ${skinLook(next.id).name} · ${formatScore(points)} / ${formatScore(next.threshold)}`;
        fill.style.width = `${(share * 100).toFixed(1)}%`;
        bar.setAttribute("aria-valuemin", String(from));
        bar.setAttribute("aria-valuemax", String(next.threshold));
        bar.setAttribute("aria-valuenow", String(Math.min(points, next.threshold)));
      } else {
        text.textContent = `All Skins unlocked · ${formatScore(points)} Lifetime Points`;
        fill.style.width = "100%";
      }
      progress.append(text, bar);
      root.append(progress);
    },
  };
}
