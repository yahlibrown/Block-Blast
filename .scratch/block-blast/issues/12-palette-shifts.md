# 12: Palette Shifts

**What to build:** As the score passes thresholds during a Run, the background and glow colors change with a smooth transition. This is a Palette Shift, a "leveling up" feeling. The starting threshold is every 1,000 points, set in the tuning table. Palette Shifts are layered on top of the chosen Skin and never replace it. They reset at the start of each Run. The current level is part of the saved Run, so resuming keeps it.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** resolved

- [x] The core emits a Palette Shift event with the new level when the score crosses a threshold
- [x] Thresholds come from the tuning table
- [x] The background and glow colors transition smoothly to the new level's palette
- [x] The level resets to 0 on a new Run
- [x] The level is included in the saved state (if 08 is done; otherwise noted for 08)
- [x] Core tests cover: crossing one threshold, crossing two thresholds with one Placement, no shift below the first threshold, reset on a new Run

## Comments

- Implemented on branch `ticket-12-palette-shifts`. Core: `GameState.paletteLevel`, `paletteShift { level }` event (after boardClear, before trayDealt; one event with the final level even when a Placement passes several thresholds), `TUNING.palette.shiftEvery = 1000`. `serialize` writes `paletteLevel`, so ticket 08 saves it with the rest of the Run.
- Human to verify by playtest (desktop + phone): the background/glow blend (~1.2 s) feels smooth and readable at each level, the HUD band behind the score changes with the canvas, and starting a new Run blends back to the base colors.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). All acceptance criteria met.
