# 12: Palette Shifts

**What to build:** As the score passes thresholds during a Run, the background and glow colors change with a smooth transition. This is a Palette Shift, a "leveling up" feeling. The starting threshold is every 1,000 points, set in the tuning table. Palette Shifts are layered on top of the chosen Skin and never replace it. They reset at the start of each Run. The current level is part of the saved Run, so resuming keeps it.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [ ] The core emits a Palette Shift event with the new level when the score crosses a threshold
- [ ] Thresholds come from the tuning table
- [ ] The background and glow colors transition smoothly to the new level's palette
- [ ] The level resets to 0 on a new Run
- [ ] The level is included in the saved state (if 08 is done; otherwise noted for 08)
- [ ] Core tests cover: crossing one threshold, crossing two thresholds with one Placement, no shift below the first threshold, reset on a new Run
