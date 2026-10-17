# 13: Skins and Lifetime Points

**What to build:** Long-term progression.
- **Lifetime Points**: the sum of every Run's final score, kept on the device.
- **Five Skins**: named visual styles for the Board and blocks. Each unlocks when Lifetime Points reach its threshold; starting thresholds are in the tuning table, e.g. 0, 5,000, 15,000 and so on. A Skin can unlock mid-Run, because the check is Lifetime Points plus the current Run's score.
- **Mid-Run unlock**: a "New Skin unlocked!" banner appears.
- **Game Over screen**: shows a progress bar toward the next Skin, and a full reveal of any Skin unlocked in that Run.
- **Settings sheet**: gets a Skin picker. Unlocked Skins can be chosen; locked ones show their threshold. The chosen Skin is saved.
- Palette Shifts continue to layer on top of the chosen Skin.

**Blocked by:** 04 (Game Over and Play again), 08 (Save and resume), 11 (Sound, haptics and settings)

**Status:** resolved

- [x] At Game Over, the core adds the Run's final score to Lifetime Points
- [x] The core emits a Skin unlocked event once per Skin, at the Placement where Lifetime Points plus the current score reach its threshold
- [x] Five Skins exist, each with a distinct Board and block style; the first is unlocked from the start
- [x] A "New Skin unlocked!" banner appears mid-Run without blocking play
- [x] The Game Over screen shows a progress bar toward the next Skin and reveals any Skin unlocked in that Run
- [x] The settings sheet has a Skin picker: unlocked Skins are selectable, locked ones show their threshold
- [x] Lifetime Points, unlocked Skins and the chosen Skin survive reloads
- [x] Core tests cover: Lifetime Points accumulating across Runs, a mid-Run unlock, an unlock firing only once, a Run crossing two thresholds at once, and save/restore of the profile

## Comments

- Implemented on branch `ticket-13-skins-and-lifetime-points`. Covered by tests: core (`src/core/skins.test.ts`), profile/settings persistence, director cue and overlay banner, and the Skin look catalogue.
- Human to verify on a phone: the five Skins look distinct and good (picker in Settings; Classic, Neon, Candy, Forest, Royal Gold); the mid-Run "New Skin unlocked!" banner reads well under the Board and never blocks a drag; the Game Over progress bar and reveal card (with "Use this Skin") look right, and the panel scrolls on short screens; Palette Shifts still tint the chosen Skin. Tip: to reach a threshold quickly, edit `TUNING.skins.thresholds` locally.
- Thresholds are first guesses (0 / 5,000 / 15,000 / 35,000 / 75,000) in `TUNING.skins.thresholds`; tune by playtest.

- 2026-10-17 (orchestrator): Implemented and merged into integration branch `block-blast` (review fixes merged at a75ddde). All acceptance criteria met.
