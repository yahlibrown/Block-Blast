# 08: Full iPhone playtest on the live site

**What to build:** A full playtest of the deployed site after everything else is in, to confirm friends can play on iPhone. Play several full Runs on the iPhone 16 (iOS 27):
- in a Safari tab;
- after Share → Add to Home Screen, including once in airplane mode.

Then do a quick regression check on the Android phone. File any problems as new tickets.

See the spec: Play on iPhone.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07

**Status:** ready-for-human

- [ ] Safari tab: everything fits; Drags never swipe back, zoom or bounce; sound follows the silent switch; no vibration toggle; the sideways screen works; the Home Screen Hint shows from the second Game Over and stays gone once dismissed
- [ ] Home Screen app: full-screen, works offline, picks up a new deploy on the next launch, and never shows the Home Screen Hint
- [ ] Android: Drag, Snap, sound, vibration and layout unchanged
- [ ] Desktop Chrome device mode: the iPhone SE and Pro Max sizes look right

## Comments
