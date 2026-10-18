# 06: Sound on iPhone

**What to build:** Sounds on iPhone behave like a normal casual game:
- They play from the player's first touch.
- They stay silent while the silent switch is on. Don't force a playback audio session.
- They keep working after the player switches apps or locks the phone and comes back. Re-unlock on the next touch if the audio was suspended or interrupted.

Android sound is unchanged.

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] With the silent switch off, the first Placement plays its sound, and Clears and Combos sound as on Android
- [x] With the silent switch on, the game is silent
- [x] After switching apps (or locking the phone) and coming back, sounds play again on the next touch
- [x] The sound toggle in settings still works
- [ ] Checked on the iPhone in a Safari tab and as a Home Screen app; Android still sounds right

## Comments

- Agent (branch `iphone-06`): built test-first against `createAudio` with a fake AudioContext (`src/audio/audio.test.ts`).
  - First touch: the shell now also unlocks on `pointerup`/`touchend` (iOS only treats a touch's end as a gesture), in the capture phase so it runs before the drop's Placement. Sounds requested while that resume is still pending are scheduled and play when it settles, so the first Placement has its thunk.
  - Silent switch: `navigator.audioSession.type = "ambient"` where it exists (iOS 17+), so the switch mutes the game and the player's music keeps playing; never "playback".
  - Backgrounding: when the context is `suspended`/`interrupted`, the next touch resumes it and replays the silent blip inside the gesture; a `closed` context is replaced. Sounds are dropped (not queued) while it's stopped or after a refused resume.
  - The sound toggle and Android path are unchanged (`enabled` flag as before). Criteria ticked are covered by the fakes and code only; the silent switch and backgrounding still need the on-device check.
