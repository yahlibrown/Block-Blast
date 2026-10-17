# 04: Game Over and Play again

**What to build:** The Run ends when no Piece remaining in the Tray fits anywhere on the Board. This is checked after each Placement and after each new Tray is dealt. Game Over is final: no revive, no undo. A Game Over screen appears over the Board with a big "Play again" button, which starts a fresh Run with one tap. The Game Over screen will later show the score, Best Score and Skin progress (tickets 05 and 13); leave room for them.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** ready-for-agent

- [x] The core emits a Game Over event when no remaining Tray Piece fits anywhere
- [x] Game Over is detected both after a Placement and immediately after a new Tray is dealt
- [x] Placements attempted after Game Over are rejected
- [x] A Game Over screen with a "Play again" button appears; tapping it starts a new Run with an empty Board and a new Tray
- [x] Core tests cover: Game Over when no Piece fits; no Game Over when exactly one remaining Piece fits; rejecting a Placement after Game Over

## Comments

- Human: on a phone, play until stuck and check the Game Over screen appears over the Board, drags are blocked behind it, and one tap on "Play again" starts a fresh Run (empty Board, new Tray).
- The "Game Over right after a deal" test is a property over 200 seeds (gameOver follows trayDealt exactly when no dealt Piece fits), so it keeps holding once ticket 06 adds the fit guarantee.
