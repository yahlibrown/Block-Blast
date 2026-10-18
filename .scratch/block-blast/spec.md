# Spec: Ad-free Block Blast clone

Status: implemented (awaiting phone playtests)

## Problem Statement

I love playing Block Blast on my Android phone, but the ads keep interrupting me and ruin the experience. I want the same game with the same rules and the same satisfying, dopamine-heavy feedback, but with no ads, no accounts and no store. It should be something I can install on my phone myself, that keeps working offline, and that keeps improving as changes are made.

## Solution

An ad-free, single-player, endless puzzle game that follows Block Blast Classic's rules. It ships as an installable web app (PWA) on GitHub Pages. I open the link once on my Android phone, tap "Add to Home Screen", and from then on it launches full-screen and works offline. Each Run reproduces Block Blast's feel-good loop:
- escalating Praise messages
- Combos with a visible multiplier
- particles, flashes and screen shake
- generated sounds and vibration
- a score that counts up
- "NEW BEST!" moments
- Palette Shifts during a Run
- Skins that unlock over time from Lifetime Points

My progress and any Run in progress are saved on the phone. Closing the app never loses a Run.

## User Stories

### Installing and launching

1. As a player, I want to open a link on my Android phone and add the game to my home screen, so that it launches like a normal app.
2. As a player, I want the installed game to open full-screen without a browser bar, so that it feels like a native game.
3. As a player, I want the game to work with no internet connection, so that I can play on the subway or on a plane.
4. As a player, I want the installed game to pick up new versions automatically, so that I get improvements without reinstalling.
5. As a player, I want the game to open straight into a Run, so that there are no taps between me and playing.
6. As a player, I want the game locked to portrait orientation, so that the layout never flips while I hold the phone.
7. As a player, I want no ads, accounts, logins or network requests, so that nothing interrupts me or tracks me.

### Board, Tray and Placement

8. As a player, I want an 8×8 Board, so that the game plays exactly like Block Blast Classic.
9. As a player, I want a Tray of three Pieces offered at a time, so that I can plan which order to place them in.
10. As a player, I want to place the three Pieces of a Tray in any order, so that I can choose the best sequence.
11. As a player, I want a new Tray of three dealt only after all three Pieces are placed, so that the rhythm matches Block Blast.
12. As a player, I want Pieces to keep a fixed orientation and never rotate, so that the rules match the original.
13. As a player, I want the standard Block Blast set of Piece shapes, so that my experience and instincts carry over.
14. As a player, I want to drag a Piece from the Tray onto the Board with my finger, so that placing feels direct and physical.
15. As a player, I want the dragged Piece to float a little above my finger, so that my thumb doesn't hide where it's going.
16. As a player, I want a ghost preview on the Board showing exactly where the Piece will land, so that I place it precisely.
17. As a player, I want the Lines that would Clear to light up while I drag, so that I feel the anticipation before I drop.
18. As a player, I want a Piece dropped where it doesn't fit to snap back to the Tray, so that a bad drop never costs me anything.
19. As a player, I want a Piece to be placeable only on empty Cells within the Board, so that the rules are unambiguous.
20. As a player, I want Pieces in the Tray that currently can't fit anywhere to look dimmed, so that I can see my options at a glance.

### Clears, Combos and scoring

21. As a player, I want every full row and full column to Clear after a Placement, so that I can make space.
22. As a player, I want all Lines completed by one Placement to Clear together, including a row and a column at the same time, so that big setups pay off.
23. As a player, I want +1 point for every block I place, so that every Placement feels like progress.
24. As a player, I want Clear points that grow faster than the number of Lines (1 → 10, 2 → 30, 3 → 60, 4 → 100, and so on), so that a Multi-Clear is worth far more than clearing Lines one at a time.
25. As a player, I want a Combo that grows by one each time a Placement Clears, so that keeping a streak going feels rewarding.
26. As a player, I want my Combo to survive up to two Placements without a Clear, and break only on the third Placement in a row with no Clear, so that I have room to set up the next Clear.
27. As a player, I want Clear points multiplied by my current Combo, so that long streaks produce huge scores.
28. As a player, I want a big flat bonus (+300) for a Board Clear, so that the rarest achievement feels special.
29. As a player, I want to see my current score and Best Score at all times, so that I always know how close I am to a record.

### Dealing fairness

30. As a player, I want every new Tray to contain at least one Piece that fits on the Board as it is when the Tray is dealt, so that a Run never ends unfairly the moment a Tray is dealt.
31. As a player, I want dealing to lean slightly toward Pieces that would complete a Line, so that near-misses and Clears keep coming like in Block Blast.
32. As a player, I want the dealing to still feel random, not scripted, so that the game stays challenging.

### Game Over

33. As a player, I want the Run to end when no Piece remaining in the Tray fits anywhere on the Board, so that the ending follows Block Blast's rule.
34. As a player, I want Game Over to be final, with no revive and no undo, so that my Best Score stays honest.
35. As a player, I want a Game Over screen showing my score and my Best Score, so that I can see how I did.
36. As a player, I want a big "Play again" button on the Game Over screen, so that starting the next Run takes one tap.
37. As a player, I want the Game Over screen to show my progress toward the next Skin, so that even a bad Run feels like it counted.

### Praise and feedback (the dopamine layer)

38. As a player, I want an encouraging Praise message ("Good!", "Great!", "Excellent!", "Amazing!", "Unbelievable!") after a Clear, so that I feel rewarded.
39. As a player, I want Praise to escalate with the size of the Multi-Clear and the Combo level, so that bigger plays get bigger praise.
40. As a player, I want a prominent "COMBO ×N" display when my Combo grows, so that I can feel my streak building.
41. As a player, I want cleared Lines to flash and their blocks to burst into particles, so that every Clear is satisfying to watch.
42. As a player, I want the screen to shake, with the shake scaling with the size of the Clear, so that big Clears feel powerful.
43. As a player, I want a satisfying "thunk" sound when a Piece lands, so that every Placement feels solid.
44. As a player, I want a chime whose pitch rises with each Combo step, so that I can hear my streak climbing.
45. As a player, I want my phone to vibrate on Placements and Clears, stronger for bigger Clears, so that the game feels physical.
46. As a player, I want the score to roll up rather than jump, so that earning points feels like a payout.
47. As a player, I want an over-the-top celebration for a Board Clear, so that the rarest moment is the most memorable.
48. As a player, I want a "NEW BEST!" burst the moment my score passes my Best Score mid-Run, so that I get a rush right when it happens.
49. As a player, I want a short message when my Combo breaks, or a calm reset of the display, so that I know the streak is over.

### Skins and Palette Shifts

50. As a player, I want my Lifetime Points (the total of all my Runs' final scores) tracked on my phone, so that every Run moves me forward.
51. As a player, I want five Skins, each unlocked when my Lifetime Points reach its threshold, so that I have long-term goals.
52. As a player, I want a "New Skin unlocked!" banner the moment a Skin unlocks mid-Run, so that I get the hit immediately.
53. As a player, I want a full reveal of a newly unlocked Skin on the Game Over screen, so that I can appreciate it and choose to equip it.
54. As a player, I want to choose any unlocked Skin in settings, so that I can play with the look I like.
55. As a player, I want locked Skins shown with their unlock threshold, so that I know what I'm working toward.
56. As a player, I want the background and glow colors to change as my score passes thresholds during a Run (Palette Shifts), so that a long Run feels like it's leveling up.
57. As a player, I want Palette Shifts layered on top of my chosen Skin and never replacing it, so that my choice is respected.
58. As a player, I want Palette Shifts to reset at the start of each Run, so that each Run builds up again.

### Settings

59. As a player, I want a gear icon that opens a small settings sheet, so that options never clutter the play area.
60. As a player, I want to turn sound on or off, so that I can play quietly.
61. As a player, I want to turn vibration on or off, so that I can play without buzzing.
62. As a player, I want my settings remembered between launches, so that I don't have to reset them each time.

### Persistence and resume

63. As a player, I want the current Run (Board, Tray, score, Combo and Palette Shift level) saved after every Placement, so that nothing is lost if Android closes the app.
64. As a player, I want reopening the app to resume my Run exactly where I left off, so that I can play in short bursts.
65. As a player, I want my Best Score, Lifetime Points, unlocked Skins, chosen Skin and settings kept on the device, so that my progress lasts.
66. As a player, I want corrupted or incompatible saved data to fall back to a fresh state instead of crashing, so that the game always opens.

### Developer experience

67. As the developer, I want every game rule covered by fast unit tests that need no browser, so that I can change rules with confidence.
68. As the developer, I want a seeded random source, so that a dealing scenario can be reproduced exactly in a test.
69. As the developer, I want to run the game in my desktop browser with live reload, so that I can iterate quickly.
70. As the developer, I want to open the dev build on my phone over home Wi-Fi, so that I can check touch and feel without deploying.
71. As the developer, I want every push to the main branch to build, test and deploy to GitHub Pages automatically, so that shipping to my phone needs no manual steps.
72. As the developer, I want the tuning numbers (Clear points, Combo rules, Board Clear bonus, Skin thresholds, Palette Shift thresholds, dealing bias) kept in one place, so that I can tune by playtesting.

## Implementation Decisions

Respects ADR-0001: a PWA on GitHub Pages, a pure TypeScript core, a Canvas 2D renderer, and no React or game engine.

### Modules

- **Game core**: a pure module with no DOM, timer, audio or storage access. It owns the Board, Tray, Placement, Clear, scoring, Combo, Board Clear, dealing, Game Over, Best Score, Lifetime Points, Skin unlocks and Palette Shift level. This is the single test seam.
- **Piece catalogue**: the fixed set of Piece shapes, matching Block Blast's standard set. It's part of the core.
- **Dealer**: inside the core. It deals a Tray from a seeded random source. It guarantees that at least one dealt Piece fits the current Board, and it applies a tunable bias toward Pieces that would complete a Line.
- **Tuning**: a single plain-data table of all balance numbers, read by the core.
- **Renderer**: Canvas 2D. It draws the Board, Tray, dragged Piece, ghost preview, Line highlights, particles, flashes, shake, Praise and its Combo Pop, score count-up, Skin styling and Palette Shift colors. It holds no game rules. (The score HUD and its Combo Tag are plain DOM above the canvas.)
- **Input**: pointer and touch drag handling. It lifts the Piece above the finger, carries it further than the finger moves on touch (Amplified Drag, ticket 14), keeps it on screen, and maps where it is drawn to a Board origin. It asks the core whether a Placement fits for the ghost preview, and submits the Placement on release.
- **Feedback director**: consumes the core's events and turns them into Praise text, particles, shake, sounds and vibration. It decides which Praise goes with which Multi-Clear size or Combo level.
- **Audio**: sounds generated with the Web Audio API, with no audio files. Rising chime pitch per Combo step. Respects the sound setting.
- **Haptics**: the Vibration API with intensity patterns per event. Respects the haptics setting and does nothing where unsupported.
- **Persistence**: saves and loads the core's serialized state, plus settings, in local device storage. If data fails to parse or the version doesn't match, it falls back to a fresh state.
- **Shell and screens**: the play view, Game Over overlay and settings sheet. Portrait lock is declared in the web app manifest.
- **PWA and deploy**: manifest, icons and offline caching via a Vite PWA plugin. A GitHub Actions workflow runs the tests, builds and publishes to GitHub Pages on every push to main.

### Game core interface (the seam)

- **Create**: start a new Run from a seed, and optionally from an existing profile (Best Score, Lifetime Points, unlocked Skins).
- **Attempt a Placement**: given a Tray slot and a Board origin (row, column), it returns either a rejection (doesn't fit, empty slot, or the Run is already over) or the new state plus an ordered list of events.
- **Fit query**: given a Tray slot and an origin, it reports whether the Piece fits and which Lines would Clear. This drives the ghost preview and Line highlights without changing state.
- **Tray fit query**: reports which Tray Pieces currently fit anywhere. This drives dimming.
- **Serialize and restore**: converts the full state (the Run in progress plus the profile) to and from versioned plain data.
- **Events** emitted by a Placement, in order:
  - Piece placed (block count, points)
  - Lines cleared (which rows and columns, Multi-Clear size, points)
  - Combo increased (new level) or Combo broken
  - Board Clear (bonus)
  - Palette Shift reached (new level)
  - NEW BEST (first crossing in the Run only)
  - Skin unlocked (which Skin)
  - Tray dealt
  - Game Over (final score; Lifetime Points updated)
- Lifetime Points add a Run's final score at Game Over. A Skin's unlock threshold is checked against Lifetime Points plus the current Run's score, so a Skin can unlock mid-Run.

### Rule clarifications

- Lines completed by a Placement are all detected before any are removed. A row and a column that share a Cell both Clear.
- Clear points are looked up by the number of Lines cleared at once, then multiplied by the Combo level after it has been incremented by this Clear. So the first Clear of a streak gets ×1.
- The Combo starts at 0. A Placement that Clears adds 1. Each Placement without a Clear adds to a dry count, a Clear resets the dry count, and the Combo resets to 0 when the dry count reaches 3.
- Game Over is checked after every Placement, and again after a new Tray is dealt, against the Pieces remaining in the Tray.
- The dealing guarantee applies at deal time only. Later Placements may still leave the remaining Pieces with nowhere to go.

## Testing Decisions

- A good test drives the game core through its public interface only: create, attempt a Placement, the fit queries, serialize and restore. It asserts on the returned state and events. Tests never reach into internal helpers and never assert on how something is computed, only on what the player would observe.
- Tests build specific Board layouts and Trays directly through restore, using plain data, so each rule scenario is short and readable.
- Dealing tests use a fixed seed. They check that every new Tray has at least one fitting Piece across many generated Boards, and that the same seed gives the same deal.
- Covered scenarios include:
  - single-Line and Multi-Clear points
  - a row and a column clearing simultaneously
  - Combo growth, survival across two dry Placements, and breaking on the third
  - multiplier application
  - the Board Clear bonus
  - Game Over detection, and rejecting Placements after Game Over
  - rejecting Placements that don't fit, out of bounds or overlapping
  - a new Tray only after three Placements
  - NEW BEST firing once per Run
  - a Skin unlocking mid-Run and at Game Over
  - Palette Shift thresholds
  - serialize-then-restore round trips
  - a corrupted or old-version save falling back to a fresh state
- Modules tested: the game core (including dealing and the piece catalogue) and the persistence fallback logic. The renderer, input, audio, haptics and feedback director are verified by playtesting, on desktop and on the phone over Wi-Fi.
- Tool: Vitest. Prior art: none yet; this is a new repo, and the first core tests set the pattern.

## Out of Scope

- Adventure, level or any mode other than endless Classic.
- Revives, undo and continues.
- Accounts, cloud sync, leaderboards, multiplayer and any backend.
- Ads, analytics and in-app purchases.
- iPhone-specific support (haptics in particular), app store publishing and native wrappers.
- A title or main-menu screen.
- Landscape layout.
- Sound or music asset files.
- More than five Skins in v1.

## Further Notes

- The target device is the developer's own Android phone, and Chrome on Android is the primary browser.
- All balance numbers are starting points to be tuned by playtesting. Getting the feel right matters more than matching Block Blast's exact numbers.
- Domain terms follow GLOSSARY.md: Board, Cell, Piece, Tray, Placement, Line, Clear, Multi-Clear, Combo, Board Clear, Praise, Run, Game Over, Best Score, Lifetime Points, Skin and Palette Shift.
