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
} as const;

export type Tuning = typeof TUNING;
