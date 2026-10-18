# 06: Sound on iPhone

**What to build:** Sounds on iPhone behave like a normal casual game:
- They play from the player's first touch.
- They stay silent while the silent switch is on. Don't force a playback audio session.
- They keep working after the player switches apps or locks the phone and comes back. Re-unlock on the next touch if the audio was suspended or interrupted.

Android sound is unchanged.

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] With the silent switch off, the first Placement plays its sound, and Clears and Combos sound as on Android
- [ ] With the silent switch on, the game is silent
- [ ] After switching apps (or locking the phone) and coming back, sounds play again on the next touch
- [ ] The sound toggle in settings still works
- [ ] Checked on the iPhone in a Safari tab and as a Home Screen app; Android still sounds right

## Comments
