# 11: Sound, haptics and settings

**What to build:** Sound and vibration, plus the settings sheet.
- Sounds are generated in code with the Web Audio API, with no asset files: a satisfying "thunk" when a Piece lands, Clear sounds, and a chime whose pitch rises with each Combo step.
- The phone vibrates via the Vibration API, with stronger patterns for bigger Clears and a Board Clear.
- A gear icon opens a small settings sheet with sound on/off and haptics on/off. Settings are saved on the device.

**Blocked by:** 05 (Scoring, Combo and Board Clear), 08 (Save and resume)

**Status:** ready-for-human

- [x] The landing "thunk" plays on every Placement
- [x] A Clear sound plays, and the Combo chime rises in pitch with each Combo step
- [x] Audio starts correctly after the first user gesture (browser autoplay rules)
- [x] Vibration patterns scale with Clear size; a Board Clear has its own pattern
- [x] Haptics do nothing, without errors, where vibration is unsupported
- [x] A gear icon opens a settings sheet with sound and haptics toggles; toggles take effect immediately
- [x] Settings survive reloads and fall back to defaults (both on) if the saved data is invalid
- [ ] Playtested on the Android phone: sound and vibration both work and can each be turned off

## Comments

Implemented on branch `ticket-11-sound-haptics-settings`. The cue mapping (which sound, chime pitch per Combo level, vibration pattern per Clear size / Board Clear), the haptics wrapper and the settings load/save/fallback are unit-tested. The synthesized sounds themselves and the sheet UI were not checked on a device.

For the human to verify on the Android phone (and once on desktop):
- The thunk, Clear whoosh, rising Combo chime and Board Clear fanfare sound good and aren't too loud. Tune them in `src/audio/audio.ts`; pitches and vibration lengths are in `src/feedback/sensory.ts`.
- Sound starts after the first touch, and still works after switching apps and coming back.
- Vibration is felt, and gets stronger for bigger Clears and a Board Clear.
- The gear (top-left of the score band) opens the sheet. Turning Sound or Vibration off silences it right away, and the choice survives a reload.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). Only the human checks above remain (on the Android phone / GitHub setup); set Status to resolved once verified.
