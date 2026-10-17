# 15: Snap

**What to build:** When a dragged Piece doesn't fit where it's drawn, the Ghost Snaps to the nearest spot where it does fit, and letting go places it there.
- **Nearest**: the straight-line distance, in Cells, from the Piece's exact drawn position (not rounded) to each Board origin where it fits. A spot that fits where the Piece is drawn is always the nearest.
- **Reach**: only spots within about **1.5 Cells** count. Beyond that there's no Ghost, and letting go Returns the Piece, so dropping over the Tray still cancels.
- **Stickiness**: the Ghost stays on its current spot until another spot is closer by about **¼ Cell**, so it doesn't flicker between two near-equal spots.
- **What you see is what you get**: the dragged Piece stays with the finger; only the Ghost jumps. Letting go places the Piece where the Ghost is.
- **Nearest only**: no preference for spots that would Clear.
- Works for every Drag: touch and mouse.
- Silent: a Snap plays no sound or vibration.
- Reach and stickiness are named constants next to `DRAG_GAIN`. The search is a pure, tested function that asks the core's fit query; the rules stay in the core (ADR-0001).
- Rename "snap back" to **Return** in the code to match the glossary.

**Blocked by:** 14 (Amplified Drag)

**Status:** resolved

- [x] The search picks the nearest fitting origin within reach, measured from the unrounded position
- [x] With nothing in reach, the origin is the plain nearest Cell (so the core rejects it and the Piece Returns)
- [x] The current Snap is kept unless another spot is closer by the stickiness margin
- [x] The Ghost and the Placement use the snapped origin
- [x] Tests cover: an exact fit, a Snap to a neighbour, out of reach, nearest-wins, and stickiness
- [x] "snap back" is renamed to Return in code and tests

## Comments
