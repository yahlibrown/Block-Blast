// The single tuning table: every balance number (Clear points, Combo rules,
// Board Clear bonus, Skin thresholds, Palette Shift thresholds, dealing bias)
// lives here as plain data, read by the core. Later tickets add their entries.
export const TUNING = {} as const;

export type Tuning = typeof TUNING;
