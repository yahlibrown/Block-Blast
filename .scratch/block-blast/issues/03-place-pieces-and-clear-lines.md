# 03: Place Pieces and Clear Lines

**What to build:** The first playable loop. A Tray of three Pieces from the standard Block Blast Piece set appears below the Board. The player drags a Piece onto the Board, and it lands if every Cell it covers is empty and inside the Board. Otherwise it snaps back to the Tray. After a Placement, every full row and full column Clears at once, and a row and a column sharing a Cell both Clear. When all three Pieces are placed, a new Tray of three is dealt. Dealing is plain random for now (fair dealing is ticket 06). Pieces never rotate.

The core exposes the seam from the spec: create a Run, attempt a Placement (Tray slot + Board origin → rejection, or new state + events), and a fit query. The UI only calls this seam.

**Blocked by:** 01 (Empty Board on screen)

**Status:** ready-for-agent

- [x] The Piece catalogue contains the standard Block Blast shapes, fixed orientation
- [ ] A Tray of three Pieces is shown and each can be dragged onto the Board by touch and mouse
- [x] A Placement that overlaps a filled Cell or goes off the Board is rejected and the Piece snaps back
- [x] A placed Piece fills its Cells and leaves the Tray
- [x] All Lines completed by one Placement Clear together, including a row and a column at once
- [x] A new Tray is dealt only after all three Pieces of the current Tray are placed
- [x] The core returns an ordered list of events for each Placement (at least: Piece placed, Lines cleared, Tray dealt)
- [x] Core tests cover: a valid Placement, overlap rejection, out-of-bounds rejection, an empty Tray slot rejection, a single-Line Clear, a row+column Clear, a new Tray after three Placements
- [x] Tests set up Boards and Trays as plain data, not by replaying many moves

## Comments

- Implemented on branch `ticket-03-place-pieces`. Core seam: `create`, `attemptPlacement`, `queryFit`, `trayFits`, `serialize`, `restore` (see `src/core/index.ts`). Tests: `src/core/placement.test.ts`, `src/core/core.test.ts`.
- **Human to verify** (left unticked): drag a Tray Piece onto the Board by touch on the phone and by mouse on desktop; a bad drop snaps back to its Tray slot. Drag feel (lift offset, ghost preview, Line highlights) is ticket 07.
