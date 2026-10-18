# 07: Home Screen Hint

**What to build:** The **Home Screen Hint**: a small, dismissable card on the **Game Over** screen inviting iPhone players in a Safari tab to add the game to their Home Screen so their **Best Score** and progress are never wiped.

- **Rule:** the card shows when the **device facts** say this is an iPhone in a Safari tab, the player has reached at least two Game Overs, and they haven't dismissed it. It never shows during a Run, in the Home Screen app, on Android or on desktop.
- **Saved state:** a Game Over count and a dismissed flag, kept in the hint's own section in Persistence. Reaching Game Over increments the count, and dismissing sets the flag for good.
- **Card:** short copy along the lines of "Add to Home Screen to keep your Best", the Share → Add to Home Screen steps with a Share icon, and a dismiss control. It doesn't promise that existing progress carries over, since iOS keeps the installed app's data separate. It never covers "Play again", which keeps focus.
- **Storage request:** at startup, silently ask the browser to keep the site's data where that's supported. Nothing depends on the answer, and failures are ignored.
- **Name:** code uses the glossary term Home Screen Hint.

See the spec: Play on iPhone.

**Blocked by:** 02 (Device facts)

**Status:** implemented (awaiting phone playtest, ticket 08)

- [x] Rule tests with the in-memory fake storage cover:
  - hidden after the first Game Over, shown from the second;
  - hidden after dismissal, including across a reload;
  - never shown for an iPhone Home Screen app, Android or desktop
- [x] Hint writes keep the Run, profile and settings sections intact
- [x] "Play again" stays visible, focused and one tap away with the card showing
- [x] The storage request runs at startup and never throws or blocks play
- [ ] Checked on the iPhone in a Safari tab: no card after the first Game Over, the card after the second, gone for good after dismissing. Checked as a Home Screen app: never shown

## Comments

- Built in `iphone-07`. Rule: `src/persistence/homeScreenHint.ts` (its own `homeScreenHint` section: `gameOvers`, `dismissed`), tested through Persistence with in-memory storage and the real device facts. Storage request: `src/persistence/persistentStorage.ts`, called at startup in `main.ts`; tested for no-throw, swallowed rejection and not waiting.
- Card: `src/shell/homeScreenHintCard.ts`, in a new `below` container under "Play again" on the Game Over screen, so it can't cover or push down the button. `show()` still focuses "Play again", and dismissing gives it focus back. The repo has no DOM test environment, so that part is by construction and needs the playtest.
- Only a Run ending during play counts as a Game Over. Reloading onto an already-ended Run shows its Game Over screen without counting it again.
