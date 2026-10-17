# 07: Drag feel

**What to build:** Make dragging feel like Block Blast.
- The dragged Piece floats a little above the finger, so the thumb doesn't hide it.
- A ghost preview on the Board shows exactly which Cells it will fill.
- The Lines that this Placement would Clear light up before the drop.
- Tray Pieces that currently can't fit anywhere are dimmed.

All of this comes from the core's fit queries. No rules are recomputed in the UI.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** ready-for-agent

- [ ] A Piece picked up from the Tray grows to Board scale and is drawn offset above the touch point
- [ ] The ghost preview snaps to the Board origin the Piece would land on, and appears only when the Piece fits there
- [ ] The Lines that would Clear are highlighted while hovering a fitting spot
- [ ] Tray Pieces that fit nowhere are visibly dimmed, and this updates after every Placement
- [ ] The core exposes the fit query (fits + which Lines would Clear) and the Tray fit query, with tests for both
- [ ] Playtested on the Android phone: the Piece stays visible above the thumb, and drops land where the ghost showed
