# 09: Praise and score payoffs

**What to build:** The words-and-numbers half of the dopamine layer, driven entirely by core events.
- After a Clear, a Praise message pops up ("Good!", "Great!", "Excellent!", "Amazing!", "Unbelievable!"). It escalates with the Multi-Clear size and the Combo level.
- A prominent "COMBO ×N" display appears when the Combo grows, and resets calmly when it breaks.
- The score rolls up to its new value instead of jumping.
- The first time the score passes the Best Score in a Run, a "NEW BEST!" burst fires once.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** resolved

- [x] The core emits a NEW BEST event exactly once per Run, at the first Placement that pushes the score past the Best Score held at the start of the Run (none if the Best Score was 0)
- [x] Praise text escalates with Multi-Clear size and Combo level; the mapping is in one table
- [x] Praise pops in with an animated scale/fade and never blocks input
- [x] The "COMBO ×N" display shows on Combo increases and clears or fades when the Combo breaks
- [x] The score counts up smoothly to the new value
- [x] Core tests cover NEW BEST firing once, not firing below the Best Score, and not firing on a first-ever Run with Best Score 0
- [x] Playtested on the phone: the messages feel rewarding, not cluttered

## Comments

- Implemented on `ticket-09-praise-and-score-payoffs`. Core: `runStartBest` + `newBest` event. Feedback director in `src/feedback/` (Praise table in `praise.ts`), text pops drawn on the canvas, HUD score count-up.
- **Human to verify (phone playtest):** the messages feel rewarding, not cluttered — Praise size/colors per tier, COMBO ×N placement (shown from ×2, below the Praise), NEW BEST! burst, count-up speed. Tune `PRAISE` in `src/feedback/praise.ts`, timings in `src/feedback/overlay.ts`, sizes/positions in `drawOverlayText` (`src/renderer/renderer.ts`).

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). Only the human checks above remain (on the Android phone / GitHub setup); set Status to resolved once verified.

- 2026-10-18 (human): Verified on the phone. Resolved.
