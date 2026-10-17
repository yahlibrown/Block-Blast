// Skins: the look of each unlockable visual style (Board, Cells, blocks and the
// base Backdrop that Palette Shifts tint). Which Skins exist and when they
// unlock is the core's business (TUNING.skins); this file only says how they look.
import type { SkinId } from "../core";
import { BASE_BACKDROP, type Backdrop } from "./palette";

/**
 * How a block is drawn:
 * - soft: rounded with a gentle top highlight (Classic)
 * - neon: dark glass with a bright outline
 * - glossy: very round, with a candy shine
 * - carved: square-ish with a darker grain band at the bottom
 * - bevel: faceted, light top-left and dark bottom-right edges
 */
export type BlockStyle = "soft" | "neon" | "glossy" | "carved" | "bevel";

export interface SkinLook {
  readonly id: SkinId;
  readonly name: string;
  readonly style: BlockStyle;
  /** Board frame color, behind the Cells. */
  readonly board: string;
  /** Empty Cell color. */
  readonly emptyCell: string;
  /** One color per core color index (COLOR_COUNT entries). */
  readonly blocks: readonly string[];
  /** Background + glow at Palette Shift level 0 (shifts tint it, never replace it). */
  readonly backdrop: Backdrop;
}

const LOOKS: Record<SkinId, SkinLook> = {
  classic: {
    id: "classic",
    name: "Classic",
    style: "soft",
    board: "#121a30",
    emptyCell: "#232f52",
    blocks: ["#ff5a5f", "#ffb330", "#ffe14d", "#4cd964", "#35c4f0", "#5b7cff", "#b45bff"],
    backdrop: BASE_BACKDROP,
  },
  neon: {
    id: "neon",
    name: "Neon",
    style: "neon",
    board: "#05060f",
    emptyCell: "#11142a",
    blocks: ["#ff2e88", "#ff9f1c", "#f5ff3b", "#39ff88", "#2ef2ff", "#4d6bff", "#c04dff"],
    backdrop: { background: "#0a0b1a", glow: "#ff2e88" },
  },
  candy: {
    id: "candy",
    name: "Candy",
    style: "glossy",
    board: "#5c2b4e",
    emptyCell: "#7a4168",
    blocks: ["#ff8fab", "#ffc46b", "#fff07a", "#9ef0a8", "#8fd8ff", "#b3a6ff", "#f2a6ff"],
    backdrop: { background: "#3b1d36", glow: "#ff8fd0" },
  },
  forest: {
    id: "forest",
    name: "Forest",
    style: "carved",
    board: "#2b1d12",
    emptyCell: "#3e2b1c",
    blocks: ["#c0503a", "#d98b2b", "#d9c26a", "#6f9e3c", "#3f8f7a", "#5a7f9e", "#8a5f9e"],
    backdrop: { background: "#16241a", glow: "#7fbf5a" },
  },
  gold: {
    id: "gold",
    name: "Royal Gold",
    style: "bevel",
    board: "#1a1408",
    emptyCell: "#2c2412",
    blocks: ["#e0b040", "#f2cf63", "#c9973a", "#fff0b0", "#d8c8a8", "#b58a2e", "#f5dc8a"],
    backdrop: { background: "#1f1a10", glow: "#ffd34d" },
  },
};

export function skinLook(id: SkinId): SkinLook {
  return LOOKS[id];
}

/** The default look (the first Skin). */
export const DEFAULT_SKIN_LOOK: SkinLook = LOOKS.classic;
