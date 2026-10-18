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

**Status:** implemented (awaiting phone playtest, ticket 08)

- [x] New layout tests cover:
  - iPhone SE in a Safari tab (about 375×550);
  - iPhone SE as a Home Screen app;
  - standard iPhones;
  - Pro Max;
  - a typical Android phone
- [x] The tests assert that the Board and all three Tray slots lie fully inside the space left after the top band and the safe-area insets, don't overlap each other or the top band, and that the Board stays square and centered
- [x] Collapsing or expanding Safari's toolbar mid-Run never puts the Board or Tray under it
- [ ] Checked in desktop Chrome's device mode at iPhone SE and Pro Max sizes
- [ ] Checked on the iPhone, in a Safari tab and as a Home Screen app: everything fits, and nothing sits under the notch or the Home indicator. Android still looks right

## Comments

- Agent (branch `iphone-03`): `layoutGame` now takes the safe-area insets and reserves the top band (`TOP_BAND_HEIGHT`, 72px below the top inset). The canvas fills the page and the HUD sits over it. `src/shell/viewport.ts` sets `--app-height` from the visual viewport on every resize, visual-viewport resize and orientation change, reads the insets through an `env()` probe, and re-lays out. The Game Over overlay and settings sheet use `--app-height` and the insets. Both panels are now `border-box`, so they no longer overflow narrow screens sideways. Tests in `src/renderer/layout.test.ts` cover the SE (Safari tab with toolbars shown and collapsed, and as a Home Screen app), iPhone 16, 13 mini, Pro Max and Android, plus a toolbar growing mid-Run. The toolbar criterion is met in code and tests only: the Chrome device-mode check and the on-phone checks are still to do.
