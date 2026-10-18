# 04: Drags never swipe back, zoom or bounce

**What to build:** On an iPhone in a Safari tab, the game owns every touch on the play area:
- A Drag that starts at the left screen edge carries the Piece instead of swiping the page back.
- A Drag near the bottom doesn't pull up Safari's toolbar or trigger the Home indicator.
- Double taps and pinches never zoom.
- The page never scrolls or bounces.
- Long-presses never select text or open a callout.

Keep the existing touch, selection, callout and overscroll rules, and add whatever iOS Safari still needs. For example, cancel the default action of touches that begin on the play area. Buttons, the settings sheet and the Skin picker must stay tappable and scrollable.

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Checked on the iPhone in a Safari tab:
  - edge-started Drags never go back a page;
  - bottom-row Placements are reliable;
  - no zoom on double tap or pinch;
  - no page bounce;
  - no text selection or callout on long-press
- [ ] The settings sheet and Skin picker still scroll, and every button still responds to a single tap
- [ ] Android Drags, Snap and Return feel unchanged

## Comments
