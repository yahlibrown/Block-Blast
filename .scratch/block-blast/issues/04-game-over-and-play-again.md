# 04: Game Over and Play again

**What to build:** The Run ends when no Piece remaining in the Tray fits anywhere on the Board. This is checked after each Placement and after each new Tray is dealt. Game Over is final: no revive, no undo. A Game Over screen appears over the Board with a big "Play again" button, which starts a fresh Run with one tap. The Game Over screen will later show the score, Best Score and Skin progress (tickets 05 and 13); leave room for them.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** ready-for-agent

- [ ] The core emits a Game Over event when no remaining Tray Piece fits anywhere
- [ ] Game Over is detected both after a Placement and immediately after a new Tray is dealt
- [ ] Placements attempted after Game Over are rejected
- [ ] A Game Over screen with a "Play again" button appears; tapping it starts a new Run with an empty Board and a new Tray
- [ ] Core tests cover: Game Over when no Piece fits; no Game Over when exactly one remaining Piece fits; rejecting a Placement after Game Over
