# 05: "Turn your phone upright" screen

**What to build:** iPhones ignore the app's portrait lock, so the game handles being sideways itself. When the **device facts** say the screen isn't upright, an overlay asks the player to turn the phone upright and blocks input underneath:
- A Piece mid-Drag Returns to its Tray slot, and no Placement happens.
- Turning the phone back removes the overlay with the Run exactly as it was.

This applies in a Safari tab, in the Home Screen app and on Android when it isn't locked.

See the spec: Play on iPhone.

**Blocked by:** 02 (Device facts)

**Status:** implemented (awaiting phone playtest, ticket 08)

- [x] Sideways shows the overlay; upright hides it
- [x] A Drag in progress when the phone turns ends in a Return, never a Placement
- [x] The Run (Board, Tray, score, Combo) is unchanged after turning back
- [ ] Checked on the iPhone in a Safari tab and as a Home Screen app

## Comments

- Built on `iphone-05`. The device facts gain an optional `touchFirst` input (the shell reads `pointer: coarse`) and a `turnUpright` fact: sideways *and* touch-first. That way a wide desktop window, where the README says to develop, is never covered. `attachDrag` now returns `{ cancel() }`, which ends a Drag in progress with a Return and ignores that finger's later moves and lift (tested with a fake canvas in `src/input/drag.test.ts`). `src/shell/uprightScreen.ts` is the overlay (z-index above settings and Game Over). `main.ts` checks on `resize`, `orientationchange` and visual-viewport resize: sideways → cancel the Drag and show the overlay; upright → hide it. The Run is never touched, so it's unchanged by construction. The overlay itself isn't unit-tested (playtest, per the spec). Still to do: the phone checks.
