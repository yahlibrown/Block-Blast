# 16: Combo Pop and Combo Tag

**What to build:** Replace ticket 09's held "COMBO ×N" display, which sits over the Board at full opacity for the whole Combo and hides the play area, with two pieces:
- **Combo Pop**: when the Combo grows to ×2 or more, "COMBO ×N" appears right under the Praise and pops in, drifts up and fades out *with* the Praise as one message. It never lingers on the Board.
- **Combo Tag**: a small cyan "×N" in the top band, between Score and Best. It appears when the Combo reaches ×2, bumps briefly each time the level rises and otherwise stays still. When the Combo breaks, it fades out over about ½ s. Nothing appears on the Board when the Combo breaks.
- **Resume**: a resumed Run mid-Combo shows the Tag at the saved level at once, with no bump and no Pop. A new Run starts with the Tag hidden. Only a live increase gets a bump or a Pop.
- Praise, NEW BEST! and the New Skin banner are unchanged.
- The display threshold stays `COMBO_DISPLAY_FROM` (×2).
- Out of scope: showing that the streak is at risk (for example dimming the Tag after dry Placements). This is a possible later ticket.

**Blocked by:** 09 (Praise and score payoffs)

**Status:** ready-for-human

- [x] No Combo text is drawn over the Board except the Combo Pop, which fades on the Praise's timeline
- [x] The Combo Pop sits just under the Praise and moves and fades with it
- [x] The Combo Tag shows the current level beside the score while the Combo is ×2 or higher, and is hidden otherwise
- [x] The Combo Tag bumps on each increase and fades out when the Combo breaks
- [x] On resume, the Tag shows the saved level with no bump or Pop; on a new Run, it is hidden
- [x] Overlay tests cover: the Pop expiring with the Praise, and no Combo frame persisting after that
- [x] Code names match the glossary (Combo Pop, Combo Tag)
- [ ] Playtested on the phone: the Board is never covered for longer than the Praise

## Comments

- 2026-10-18 (grilling): The human reported that the Combo display "is in the middle of the screen and hiding the board. It never fades away or moves." Cause: `src/feedback/overlay.ts` holds the combo frame at alpha 1 until `comboEnd`, and `src/renderer/renderer.ts` pins it at 66% of the Board's height. Decisions Q1–Q10: brief Pop with the Praise, a Tag off the Board, a calm fade on break, no at-risk indicator, glossary terms Combo Pop and Combo Tag.
- 2026-10-18 (implement): Built on `block-blast`. The Combo Pop is attached to its Praise in `src/feedback/overlay.ts`, so it shares the Praise's frame. The Combo Tag is a pure model in `src/feedback/comboTag.ts` (tested), drawn by the HUD (`src/shell/hud.ts`, `.hud-combo` in `style.css`). The renderer's `comboPop` row is 0.59, just under the Praise at 0.45. Review: no hard issues. The renames to `comboPop` / `comboLevel` and the spec.md wording are applied.
- Human to verify on the phone: with a 6-digit score, the Tag may crowd or overlap Best (it sits 8px right of the centered score); a top-tier Praise and the Combo Pop may touch during the pop-in overshoot; and a resumed Run that already ended shows the Tag behind the Game Over screen. Tune `.hud-combo` and `TEXT_ROW.comboPop` if needed.
