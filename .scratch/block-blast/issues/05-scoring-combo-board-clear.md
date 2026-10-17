# 05: Scoring, Combo and Board Clear

**What to build:** Scoring that matches the spec, shown on screen along with the Best Score:
- Every Placement scores +1 per block placed.
- A Clear scores points looked up by how many Lines it cleared at once (starting values 1 → 10, 2 → 30, 3 → 60, 4 → 100, growing beyond).
- Clear points are multiplied by the Combo.

Combo rules: the Combo starts at 0 and gains 1 for each Placement that Clears, and the multiplier uses the level after this increment, so the first Clear is ×1. Placements without a Clear add to a dry count, and a Clear resets it. When the dry count reaches 3, the Combo resets to 0.

A Board Clear (the Board fully empty after a Clear) adds a flat bonus, starting at +300.

All numbers live in a single tuning table. The Best Score is kept in memory for now; persisting it is ticket 08. Both scores appear on the Game Over screen.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** resolved

- [x] The current score and Best Score are visible during play and on the Game Over screen
- [x] The core emits events for: points from a Placement, a Clear (Lines, Multi-Clear size, points), Combo increased (level), Combo broken, and Board Clear (bonus)
- [x] All balance numbers come from one tuning table
- [x] Core tests cover: block points; points for 1, 2, 3 and 4 Lines; the Combo multiplier on the first and later Clears; the Combo surviving two dry Placements and breaking on the third; the dry count resetting on a Clear; the Board Clear bonus; the Best Score updating when beaten

## Comments

- Implemented on branch `ticket-05-scoring-combo-board-clear`. Score and Best Score show in a DOM HUD band above the canvas during play (`src/shell/hud.ts`), and as rows in ticket 04's Game Over `stats` container (`createScoreStats`). "Play again" carries the Best Score into the next Run (`create({ seed, best })`); it is in memory only until ticket 08.
- Human to verify on the phone: the HUD band sits clear of the notch/status bar, the Board still fits below it, and the Game Over screen shows the right score and Best Score.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). All acceptance criteria met.
