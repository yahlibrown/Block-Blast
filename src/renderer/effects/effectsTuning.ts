// Clear effects feel numbers (ticket 10). UI-only, not core balance, so they live next to
// the effects player rather than in TUNING. Lengths are in Board Cells. How hard a Clear
// shakes is the feedback director's call (`src/feedback/clearCues.ts`).
export const EFFECTS = {
  /** Cleared Lines flash (white wash over their old blocks) for this long before bursting. */
  flashMs: 140,
  /** Particles per cleared block, how long they live, and how fast they fly (Cells per second). */
  particles: { perBlock: 6, lifeMs: 650, speed: 6, gravity: 18, size: 0.22, max: 900 },
  /** A big burst (Board Clear): more, faster particles, and how long the full-Board flash lasts. */
  big: { particleMultiplier: 2.5, speedMultiplier: 1.5 },
  boardFlashMs: 600,
} as const;
