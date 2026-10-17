# 06: Fair dealing

**What to build:** Replace the plain random dealing with a seeded Dealer:
- Every new Tray contains at least one Piece that fits the Board as it is at deal time, so a Run never ends the instant a Tray is dealt.
- Dealing leans slightly toward Pieces that would complete a Line. This keeps near-misses and Clears coming without feeling scripted.
- The bias strength is in the tuning table.
- A Run is created from a seed, and the same seed plus the same Placements gives the same Trays.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** resolved

- [x] A Run can be created from a seed, and dealing is fully determined by it
- [x] Every newly dealt Tray has at least one Piece that fits the current Board, whenever any Piece in the catalogue fits
- [x] The Line-completion bias is tunable, including turning it off
- [x] Core tests cover: the same seed gives the same deal; across many generated Boards (some nearly full), every new Tray has a fitting Piece; with the bias on, Line-completing Pieces appear more often than with it off (statistical check with a fixed seed)

## Comments

Implemented on branch `ticket-06-fair-dealing`. The bias strength is `TUNING.dealer.lineBias`. The default is 1, so a Line-completing Piece is twice as likely as any other; 0 turns the bias off. On the test's near-miss Boards it raises the share of Line-completing Pieces dealt from about 18% to 27%. Human: playtest on the phone and check that Clears keep coming without the deals feeling scripted. Retune `lineBias` if they do.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). All acceptance criteria met.
