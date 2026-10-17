// The single tuning table: every balance number (Clear points, Combo rules,
// Board Clear bonus, Skin thresholds, Palette Shift thresholds, dealing bias)
// lives here as plain data, read by the core. Later tickets add their entries.
export const TUNING = {
  dealer: {
    /**
     * Line bias: a Piece that could complete a Line on the current Board is
     * dealt with weight 1 + lineBias (every other Piece has weight 1).
     * 0 = plain uniform dealing.
     */
    lineBias: 1,
  },
  scoring: {
    /** Points per block placed. */
    pointsPerBlock: 1,
    /**
     * Clear points by Multi-Clear size: index 0 = 1 Line, 1 = 2 Lines, …
     * Beyond the table the step keeps growing by the table's last step growth.
     */
    clearPoints: [10, 30, 60, 100, 150, 210],
    /** The Combo breaks on this many Placements in a row without a Clear. */
    comboBreakDry: 3,
    /** Flat bonus when a Clear leaves the Board fully empty. */
    boardClearBonus: 300,
  },
  palette: {
    /** A Palette Shift happens each time the Run's score passes another multiple of this. */
    shiftEvery: 1000,
  },
  skins: {
    /**
     * Lifetime Points needed to unlock each Skin, in catalogue order (rising).
     * The first must be 0: it is the starting Skin. A Skin unlocks the moment
     * Lifetime Points plus the current Run's score reach its threshold.
     */
    thresholds: { classic: 0, neon: 5000, candy: 15000, forest: 35000, gold: 75000 },
  },
} as const;

export type Tuning = typeof TUNING;
