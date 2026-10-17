# 09: Praise and score payoffs

**What to build:** The words-and-numbers half of the dopamine layer, driven entirely by core events.
- After a Clear, a Praise message pops up ("Good!", "Great!", "Excellent!", "Amazing!", "Unbelievable!"). It escalates with the Multi-Clear size and the Combo level.
- A prominent "COMBO ×N" display appears when the Combo grows, and resets calmly when it breaks.
- The score rolls up to its new value instead of jumping.
- The first time the score passes the Best Score in a Run, a "NEW BEST!" burst fires once.

**Blocked by:** 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [ ] The core emits a NEW BEST event exactly once per Run, at the first Placement that pushes the score past the Best Score held at the start of the Run (none if the Best Score was 0)
- [ ] Praise text escalates with Multi-Clear size and Combo level; the mapping is in one table
- [ ] Praise pops in with an animated scale/fade and never blocks input
- [ ] The "COMBO ×N" display shows on Combo increases and clears or fades when the Combo breaks
- [ ] The score counts up smoothly to the new value
- [ ] Core tests cover NEW BEST firing once, not firing below the Best Score, and not firing on a first-ever Run with Best Score 0
- [ ] Playtested on the phone: the messages feel rewarding, not cluttered
