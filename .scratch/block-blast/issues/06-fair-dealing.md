# 06: Fair dealing

**What to build:** Replace the plain random dealing with a seeded Dealer:
- Every new Tray contains at least one Piece that fits the Board as it is at deal time, so a Run never ends the instant a Tray is dealt.
- Dealing leans slightly toward Pieces that would complete a Line. This keeps near-misses and Clears coming without feeling scripted.
- The bias strength is in the tuning table.
- A Run is created from a seed, and the same seed plus the same Placements gives the same Trays.

**Blocked by:** 03 (Place Pieces and Clear Lines)

**Status:** ready-for-agent

- [ ] A Run can be created from a seed, and dealing is fully determined by it
- [ ] Every newly dealt Tray has at least one Piece that fits the current Board, whenever any Piece in the catalogue fits
- [ ] The Line-completion bias is tunable, including turning it off
- [ ] Core tests cover: the same seed gives the same deal; across many generated Boards (some nearly full), every new Tray has a fitting Piece; with the bias on, Line-completing Pieces appear more often than with it off (statistical check with a fixed seed)
