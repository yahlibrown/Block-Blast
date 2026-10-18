# 10: Spare height goes to the Tray, near the thumb

**What to build:** On tall screens, such as the iPhone Home Screen app, the spare height no longer ends up as a big empty band below the Tray. The Board sits a little below the top band, and the Tray moves down toward the thumb. A small, even margin stays above the Home indicator. Short screens, like a Safari tab or the iPhone SE, keep today's tight fit. This applies to every phone, Android installed included.

Found in the ticket 08 playtest: on the iPhone 16 Home Screen app, there was about 110px of empty space below the Tray.

**Blocked by:** None (can start immediately)

**Status:** implemented (awaiting phone playtest)

- [x] Layout tests: on a tall screen, the gap below the Tray (above the bottom inset) is no bigger than a small cap, and the Tray is lower than when centered
- [x] Existing fit tests still pass: everything stays inside the safe area, with no overlaps, and the Board stays square and centered horizontally
- [x] Short screens keep their current layout
- [ ] Checked on the iPhone as a Home Screen app and in a Safari tab

## Comments
