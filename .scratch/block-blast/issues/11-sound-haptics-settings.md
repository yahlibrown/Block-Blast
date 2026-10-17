# 11: Sound, haptics and settings

**What to build:** Sound and vibration, plus the settings sheet.
- Sounds are generated in code with the Web Audio API, with no asset files: a satisfying "thunk" when a Piece lands, Clear sounds, and a chime whose pitch rises with each Combo step.
- The phone vibrates via the Vibration API, with stronger patterns for bigger Clears and a Board Clear.
- A gear icon opens a small settings sheet with sound on/off and haptics on/off. Settings are saved on the device.

**Blocked by:** 05 (Scoring, Combo and Board Clear), 08 (Save and resume)

**Status:** ready-for-agent

- [ ] The landing "thunk" plays on every Placement
- [ ] A Clear sound plays, and the Combo chime rises in pitch with each Combo step
- [ ] Audio starts correctly after the first user gesture (browser autoplay rules)
- [ ] Vibration patterns scale with Clear size; a Board Clear has its own pattern
- [ ] Haptics do nothing, without errors, where vibration is unsupported
- [ ] A gear icon opens a settings sheet with sound and haptics toggles; toggles take effect immediately
- [ ] Settings survive reloads and fall back to defaults (both on) if the saved data is invalid
- [ ] Playtested on the Android phone: sound and vibration both work and can each be turned off
