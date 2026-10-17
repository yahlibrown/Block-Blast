# 10: Clear effects

**What to build:** The visual half of the dopamine layer, driven by core events:
- Cleared Lines flash, and their blocks burst into particles.
- The screen shakes, scaling with the size of the Multi-Clear and the Combo.
- A Board Clear gets an over-the-top celebration: a bigger burst, a longer shake and a full-Board flash.

The effects must run smoothly on the Android phone.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [x] Cleared Lines flash before their Cells empty
- [x] Each cleared block emits particles in its color
- [x] The shake intensity scales with Multi-Clear size and Combo level; the scaling is tunable
- [x] A Board Clear triggers a distinct, bigger celebration
- [x] Effects never delay input: the next Piece can be dragged while effects play
- [ ] Playtested on the Android phone: no visible frame drops during a large Multi-Clear

## Comments

- Implemented on branch `ticket-10-clear-effects`. Simulation (pure, tested): `src/renderer/effects/clearEffects.ts`; drawing: `src/renderer/effects/drawEffects.ts`; numbers in `TUNING.effects`.
- Because the core empties the Cells immediately, "flash before they empty" is drawn as an overlay: the cleared blocks are redrawn in their old colors with a white wash for `TUNING.effects.flashMs`, then burst. The game state (and input) never waits.
- **Human must verify:** playtest on the Android phone that a large Multi-Clear and a Board Clear show no visible frame drops (particle count is capped by `TUNING.effects.particles.max`; lower it or `perBlock` if needed), and that the shake strength feels right.
