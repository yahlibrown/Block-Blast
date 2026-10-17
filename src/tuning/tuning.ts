// The single tuning table: every balance number (Clear points, Combo rules,
// Board Clear bonus, Skin thresholds, Palette Shift thresholds, dealing bias)
// lives here as plain data, read by the core. Later tickets add their entries.
export const TUNING = {
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
} as const;

export type Tuning = typeof TUNING;
