// Palette Shift colors: the background and glow for each Palette Shift level.
//
// Layering (ticket 13): a Skin supplies the *base* Backdrop (and its own Board,
// Cell and block colors, which Palette Shifts never touch). `shiftedBackdrop`
// tints that base toward the level's palette, so level 0 is the Skin exactly
// and higher levels lean further into the shift without replacing the Skin.

/** Colors behind and around the Board. Hex `#rrggbb`. */
export interface Backdrop {
  readonly background: string;
  readonly glow: string;
}

/** Backdrop of the default look (no Skin chosen yet). Keep in sync with style.css / theme color. */
export const BASE_BACKDROP: Backdrop = { background: "#1b2440", glow: "#3a5bd9" };

/** One palette per level from 1; past the end they cycle. */
const PALETTES: readonly Backdrop[] = [
  { background: "#2a1f4a", glow: "#8a5cff" }, // 1 violet
  { background: "#3a1a3f", glow: "#ff5ca8" }, // 2 magenta
  { background: "#3d2018", glow: "#ff8a3d" }, // 3 ember
  { background: "#10332e", glow: "#2ee6b0" }, // 4 teal
  { background: "#2e3112", glow: "#d4e83a" }, // 5 lime
  { background: "#0f2a3d", glow: "#3ad1ff" }, // 6 cyan
];

/** How strongly a shifted level's palette tints the Skin's base Backdrop (0 = not at all). */
const SHIFT_STRENGTH = 0.75;

/** The Backdrop for a Palette Shift level, layered over the Skin's base Backdrop. */
export function shiftedBackdrop(level: number, base: Backdrop = BASE_BACKDROP): Backdrop {
  if (level <= 0) return base;
  const palette = PALETTES[(level - 1) % PALETTES.length]!;
  return mixBackdrop(base, palette, SHIFT_STRENGTH);
}

/** Blend two Backdrops: t = 0 → `a`, t = 1 → `b`. */
export function mixBackdrop(a: Backdrop, b: Backdrop, t: number): Backdrop {
  return { background: mixColor(a.background, b.background, t), glow: mixColor(a.glow, b.glow, t) };
}

/** Blend two `#rrggbb` colors; returns `#rrggbb`. */
export function mixColor(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i]! - v) * t))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** `#rrggbb` → rgba() string with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
