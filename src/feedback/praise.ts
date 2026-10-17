// The Praise table: which words go with which Multi-Clear size or Combo level.
// Feel tuning for the feedback director (not core balance, so not in TUNING).

/**
 * Praise tiers, weakest first. A Clear earns the strongest tier whose `lines`
 * (Multi-Clear size) OR `combo` (Combo level after this Clear) it reaches.
 */
export const PRAISE = [
  { text: "Good!", lines: 1, combo: 1 },
  { text: "Great!", lines: 2, combo: 3 },
  { text: "Excellent!", lines: 3, combo: 5 },
  { text: "Amazing!", lines: 4, combo: 7 },
  { text: "Unbelievable!", lines: 5, combo: 10 },
] as const;

/** "COMBO ×N" shows from this Combo level up (×1 is just a Clear). */
export const COMBO_DISPLAY_FROM = 2;

/** Index into PRAISE for a Clear of `lines` Lines at Combo `combo`. */
export function praiseTier(lines: number, combo: number): number {
  let tier = 0;
  PRAISE.forEach((p, i) => {
    if (lines >= p.lines || combo >= p.combo) tier = i;
  });
  return tier;
}
