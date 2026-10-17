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
  /** Clear effects (ticket 10). Read by `src/renderer/effects`, not by the core. Lengths are in Cells. */
  effects: {
    /** Cleared Lines flash (white wash over their old blocks) for this long before bursting. */
    flashMs: 140,
    /** Shake amplitude, in Cells: base + perExtraLine × (Lines − 1) + perComboLevel × (Combo − 1), capped. */
    shake: { base: 0.08, perExtraLine: 0.07, perComboLevel: 0.03, max: 0.45, durationMs: 320 },
    /** Particles per cleared block, how long they live, and how fast they fly (Cells per second). */
    particles: { perBlock: 6, lifeMs: 650, speed: 6, gravity: 18, size: 0.22, max: 900 },
    /** Board Clear celebration: everything bigger and longer, plus a full-Board flash. Shake = shake.max + shakeBonus. */
    boardClear: {
      particleMultiplier: 2.5,
      speedMultiplier: 1.5,
      shakeBonus: 0.3,
      shakeDurationMs: 900,
      flashMs: 600,
    },
  },
} as const;

export type Tuning = typeof TUNING;
