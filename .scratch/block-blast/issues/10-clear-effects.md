# 10: Clear effects

**What to build:** The visual half of the dopamine layer, driven by core events:
- Cleared Lines flash, and their blocks burst into particles.
- The screen shakes, scaling with the size of the Multi-Clear and the Combo.
- A Board Clear gets an over-the-top celebration: a bigger burst, a longer shake and a full-Board flash.

The effects must run smoothly on the Android phone.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [ ] Cleared Lines flash before their Cells empty
- [ ] Each cleared block emits particles in its color
- [ ] The shake intensity scales with Multi-Clear size and Combo level; the scaling is tunable
- [ ] A Board Clear triggers a distinct, bigger celebration
- [ ] Effects never delay input: the next Piece can be dragged while effects play
- [ ] Playtested on the Android phone: no visible frame drops during a large Multi-Clear
