# 05: "Turn your phone upright" screen

**What to build:** iPhones ignore the app's portrait lock, so the game handles being sideways itself. When the **device facts** say the screen isn't upright, an overlay asks the player to turn the phone upright and blocks input underneath:
- A Piece mid-Drag Returns to its Tray slot, and no Placement happens.
- Turning the phone back removes the overlay with the Run exactly as it was.

This applies in a Safari tab, in the Home Screen app and on Android when it isn't locked.

See the spec: Play on iPhone.

**Blocked by:** 02 (Device facts)

**Status:** ready-for-agent

- [ ] Sideways shows the overlay; upright hides it
- [ ] A Drag in progress when the phone turns ends in a Return, never a Placement
- [ ] The Run (Board, Tray, score, Combo) is unchanged after turning back
- [ ] Checked on the iPhone in a Safari tab and as a Home Screen app

## Comments
