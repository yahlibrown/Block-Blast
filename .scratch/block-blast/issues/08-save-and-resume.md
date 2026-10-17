# 08: Save and resume

**What to build:** Nothing is lost when Android closes the app. After every Placement, the full Run (Board, Tray, score, Combo with its dry count, and the dealing seed state) and the profile (Best Score so far) are saved on the device. Reopening the app resumes the Run exactly where it left off, or shows the Game Over screen if the Run had ended. Saved data is versioned. Corrupted or incompatible data falls back to a fresh state instead of crashing.

**Blocked by:** 04 (Game Over and Play again), 05 (Scoring, Combo and Board Clear)

**Status:** ready-for-agent

- [ ] The core serializes the full state to versioned plain data and restores it
- [ ] The state is saved after every Placement and on Game Over
- [ ] Reloading the page mid-Run restores the same Board, Tray, score, Combo and upcoming deal
- [ ] Best Score survives reloads
- [ ] Corrupted, missing or old-version data starts a fresh Run without crashing
- [ ] Tests cover: a serialize → restore round trip mid-Run; a restored Run dealing the same next Tray as the original; corrupted and old-version data falling back to fresh state
