# 08: Save and resume

**What to build:** Nothing is lost when Android closes the app. After every Placement, the full Run (Board, Tray, score, Combo with its dry count, and the dealing seed state) and the profile (Best Score so far) are saved on the device. Reopening the app resumes the Run exactly where it left off, or shows the Game Over screen if the Run had ended. Saved data is versioned. Corrupted or incompatible data falls back to a fresh state instead of crashing.

**Blocked by:** 04 (Game Over and Play again), 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [x] The core serializes the full state to versioned plain data and restores it
- [x] The state is saved after every Placement and on Game Over
- [x] Reloading the page mid-Run restores the same Board, Tray, score, Combo and upcoming deal
- [x] Best Score survives reloads
- [x] Corrupted, missing or old-version data starts a fresh Run without crashing
- [x] Tests cover: a serialize → restore round trip mid-Run; a restored Run dealing the same next Tray as the original; corrupted and old-version data falling back to fresh state

## Comments

Implemented in `src/persistence/persistence.ts` (tested with an in-memory storage in `persistence.test.ts`; core resume tests in `src/core/resume.test.ts`), wired in `src/shell/main.ts`. Human to verify on the phone: play a few Placements, swipe the app away (or reload), reopen and check the Board, Tray, score and Combo are the same; finish a Run, reopen and check the Game Over screen shows with Play again working; Best Score stays after reload.

