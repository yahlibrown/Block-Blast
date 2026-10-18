# 03: The game fits every screen in a Safari tab

**What to build:** In a Safari tab on any supported phone, the whole game is visible with no scrolling and nothing hidden:
- the top band (Score, Combo Tag, Best Score, settings button);
- the Board;
- all three Tray slots.

How:
- The page sizes itself to the visible viewport, and re-measures when Safari's toolbars grow or shrink.
- Safe-area insets keep content clear of the notch, the Dynamic Island and the Home indicator.
- The layout leaves room for the top band, so the Board never overlaps it.
- The settings sheet, Skin picker and Game Over screen fit and stay tappable in a Safari tab.

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New layout tests cover:
  - iPhone SE in a Safari tab (about 375×550);
  - iPhone SE as a Home Screen app;
  - standard iPhones;
  - Pro Max;
  - a typical Android phone
- [ ] The tests assert that the Board and all three Tray slots lie fully inside the space left after the top band and the safe-area insets, don't overlap each other or the top band, and that the Board stays square and centered
- [ ] Collapsing or expanding Safari's toolbar mid-Run never puts the Board or Tray under it
- [ ] Checked in desktop Chrome's device mode at iPhone SE and Pro Max sizes
- [ ] Checked on the iPhone, in a Safari tab and as a Home Screen app: everything fits, and nothing sits under the notch or the Home indicator. Android still looks right

## Comments
