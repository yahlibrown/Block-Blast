# Spec: Play on iPhone

Status: implemented (awaiting phone playtest)

## Problem Statement

I built this ad-free Block Blast for my Android phone, and now I want to share it with friends and spread the word. Many of them have iPhones. Today the game was only built and playtested for one Android phone. On an iPhone, my friends would just tap the link I send them and play in a Safari tab:
- Safari's toolbars eat into the screen.
- A Drag that starts near the left edge can swipe the page back.
- The vibration toggle does nothing.
- The game rotates sideways.
- If they don't open it for a week, Safari can quietly wipe their Best Score and Skins.

I don't want to make everyone "Add to Home Screen" or go through the App Store. I want to keep the push-to-deploy, no-headache setup.

## Solution

The game stays a link to the GitHub Pages site and works well on any recent iPhone and Android phone, straight from the browser with nothing to install:
- **Safari tab:** a first-class way to play. The Board, Tray and score fit around Safari's toolbars on every screen from the iPhone SE to the Pro Max. A Drag never triggers swipe-back, zoom or page bounce.
- **Sideways phone:** a "turn your phone upright" screen covers the game, and nothing is lost.
- **Sound:** respects the iPhone's silent switch.
- **Haptics:** iPhones can't vibrate from a web page, so the vibration toggle is hidden wherever vibration isn't supported. Android keeps vibration.
- **Keeping progress:** the game asks the browser to keep its saved data. iPhone players in a Safari tab who have played at least two Runs see a small, dismissable **Home Screen Hint** on the **Game Over** screen, inviting them to add the game to their Home Screen so their **Best Score** and progress are never wiped.
- **Home Screen app:** stays an optional extra that works full-screen and offline, as on Android.
- **README:** a short "Play on iPhone" section that I can paste into a text to friends.

## User Stories

### Getting the game

1. As a friend with an iPhone, I want to tap a link and start playing right away in Safari, so that I don't have to install anything to try it.
2. As a friend with an Android phone, I want the same link to work in Chrome, so that one link works for everyone.
3. As the developer, I want every push to `main` to reach every friend's phone, so that I keep the no-headache deploy loop.
4. As the developer, I want a short "Play on iPhone" text in the README, so that I can paste it into a message to friends.
5. As a friend, I want the sharing text to tell me I can optionally add the game to my Home Screen, so that I know how to keep it like an app.

### Playing in a Safari tab

6. As an iPhone player in a Safari tab, I want the whole Board, Tray, score and top band visible without scrolling, so that I can play without anything hidden behind Safari's toolbars.
7. As an iPhone player, I want the layout to adjust when Safari's toolbar shrinks or grows, so that nothing jumps under the toolbar mid-Run.
8. As an iPhone player, I want a Drag that starts near the left screen edge to carry the Piece rather than swipe the page back, so that I never lose the game mid-Drag.
9. As an iPhone player, I want a Drag near the bottom of the screen not to trigger Safari's toolbar or the Home indicator, so that Placements on the bottom rows feel reliable.
10. As an iPhone player, I want double taps and pinches never to zoom the page, so that the Board stays put.
11. As an iPhone player, I want the page never to bounce or scroll during a Drag, so that the Ghost lines up with my finger.
12. As an iPhone player, I want long-presses never to select text or open a callout menu, so that holding a Piece only holds the Piece.
13. As an iPhone player, I want the settings sheet, Skin picker and Game Over screen to fit and be tappable inside a Safari tab, so that every screen works without the Home Screen app.

### Screen sizes

14. As a friend with an iPhone SE, I want the Board and Tray to fit my small screen in a Safari tab, so that the game is playable on the smallest supported iPhone.
15. As a friend with a Pro Max, I want the Board to use the bigger screen sensibly, so that the game doesn't look tiny or stretched.
16. As a friend with an iPhone with a notch or Dynamic Island, I want nothing drawn under the notch or the Home indicator, so that the score and the Tray are never cut off.
17. As a friend on an older iPhone running iOS 17, I want the game to work, so that I'm not left out for not having the newest phone.

### Sideways

18. As a player who turns the phone sideways, I want a "turn your phone upright" screen, so that I'm not shown a squashed or broken layout.
19. As a player who turns the phone back upright, I want my Run exactly where I left it, so that rotating never costs me anything.
20. As a player who turns the phone sideways in the middle of a Drag, I want the Piece to Return to its Tray slot, so that no half-finished Placement happens.
21. As a player of the Home Screen app, I want the same upright screen, since iPhones ignore the app's portrait lock.

### Sound

22. As an iPhone player with the silent switch on, I want the game to stay silent, so that it behaves like other games on my phone.
23. As an iPhone player with the silent switch off, I want the game's sounds to play from my first touch, so that Clears and Combos feel as good as on Android.
24. As an iPhone player who switches apps and comes back, I want the sound to keep working, so that it doesn't go quiet after an interruption.

### Haptics

25. As an iPhone player, I don't want a vibration toggle that does nothing, so that the settings only offer what my phone can do.
26. As an Android player, I want vibration and its toggle to work as before, so that nothing gets worse for me.
27. As a player whose saved settings have vibration on, I want that saved setting kept even where the toggle is hidden, so that nothing breaks if the same save reaches a phone that can vibrate.

### Keeping progress

28. As a player, I want the game to ask my browser to keep its saved data, so that my progress is as safe as the browser allows.
29. As an iPhone player in a Safari tab, I want to be told, after I've played a bit, that adding the game to my Home Screen keeps my Best Score from being wiped, so that I don't lose my progress after a week away.
30. As an iPhone player, I want the Home Screen Hint to appear only on the Game Over screen, so that it never interrupts a Run.
31. As an iPhone player, I want the Home Screen Hint not to appear after my very first Game Over, so that I'm not asked before I know whether I like the game.
32. As an iPhone player, I want the Home Screen Hint to show the Share → Add to Home Screen steps with a Share icon, so that I know exactly what to tap.
33. As an iPhone player, I want to dismiss the Home Screen Hint, and have it stay gone, so that I'm not nagged.
34. As an iPhone player who has already added the game to my Home Screen, I don't want to see the Home Screen Hint there, so that I'm not told to do something I've done.
35. As an Android player, I never want to see the Home Screen Hint, so that I'm not given iPhone instructions.
36. As an iPhone player, I want the Home Screen Hint not to get in the way of "Play again", so that the next Run is still one tap away.
37. As a player of the Home Screen app, I want it to keep working full-screen and offline and to pick up new versions automatically, as it does on Android.

### Testing

38. As the developer without a Mac, I want to be able to see errors that happen only on my iPhone, so that I can fix iPhone-only bugs without Safari's Web Inspector.
39. As the developer, I want tests that prove the layout fits every target screen size, so that a layout change can't silently break the iPhone SE.
40. As the developer, I want tests for when the Home Screen Hint shows, so that its rules can't drift.

## Implementation Decisions

- **Distribution is unchanged.** The game remains a PWA on GitHub Pages, deployed on every push to `main` (see ADR 0001 and its 2026-10 update). There is no App Store, TestFlight or native wrapper. Push the pending local commits on `main` so the live site is current.
- **Support target:**
  - iPhones on iOS 17 and newer, in Safari tabs and as Home Screen apps.
  - Recent Chrome on Android.
  - Portrait screens from the iPhone SE (about 375×550 CSS pixels usable in a Safari tab) up to the Pro Max.
- **Device facts module (new, pure).** A small module turns browser globals into plain facts:
  - whether vibration is supported;
  - whether this is an iPhone in a Safari tab, as opposed to the Home Screen app or any non-iPhone browser;
  - whether the screen is upright.

  It takes its inputs injected (a navigator-like object, a standalone check, width and height), like the haptics wrapper's injected navigator, so it has no direct DOM access and is testable in Node. Detection must recognise iPhones even when the browser isn't Safari, since every browser on an iPhone has Safari's limits. iPads are not targeted.
- **Home Screen Hint (new).** A pure rule plus a small DOM card on the Game Over screen:
  - **Rule:** show the card when the player is an iPhone player in a Safari tab, has reached at least two Game Overs, and has not dismissed it.
  - **Saved state:** the hint keeps its own section in Persistence (a Game Over count and a dismissed flag). Reaching Game Over increments the count. Dismissing sets the flag. Persistence already keeps other sections intact when one is written.
  - **Card:** short copy along the lines of "Add to Home Screen to keep your Best", the Share → Add to Home Screen steps with a Share icon, and a dismiss control. It never covers or replaces "Play again", which keeps focus.
  - **Name:** code uses the glossary term **Home Screen Hint**.
- **Persistent storage request.** At startup, the shell silently asks the browser to keep the site's data (`navigator.storage.persist()` where available). Nothing depends on the answer, and failures are ignored.
- **Haptics toggle.** The settings sheet adds the vibration toggle only when the device facts say vibration is supported. The saved haptics setting itself is untouched. The web-haptics library and the iOS hidden-switch trick are rejected: Apple closed the trick (confirmed on iOS 27, reportedly since 26.5), and it can't be tested on the older iPhones where it still works.
- **Upright screen.** When the device facts say the screen isn't upright, a DOM overlay asks the player to turn the phone upright. It cancels any Drag in progress so the Piece Returns, and blocks input underneath. The Run is untouched, and there are no timers in play to pause. This applies in Safari tabs and in the Home Screen app, because iOS ignores the manifest's portrait lock.
- **Safari tab layout.**
  - The page sizes itself to the visible viewport: the dynamic viewport height, re-measured on resize and visual-viewport changes. That way Safari's collapsing toolbars never cover the Board or Tray.
  - Safe-area insets keep content clear of the notch, Dynamic Island and Home indicator.
  - The layout function must account for the top band (score, Combo Tag, Best Score, settings button) so the Board and Tray never overlap it.
- **Gesture guards.** Keep the existing `touch-action: none`, no-select, no-callout and no-overscroll rules. Add whatever iOS Safari needs so that a Drag starting at the screen edge doesn't trigger swipe-back and the page never scrolls or zooms during play. For example, cancel the default action of touches that begin on the canvas, where needed.
- **Sound.** Keep the current Web Audio unlock-on-gesture. Respect the silent switch: don't force a playback audio session. Make sure audio resumes after the page comes back from the background (for example, re-unlock on the next touch if the context was suspended or interrupted).
- **iPhone-only error visibility.** Add a lightweight way to see uncaught errors on the phone during playtests, behind an opt-in (for example a URL flag) so players never see it.
- **README.** Add a short "Play on iPhone" section that can be pasted into a text to friends: open the link in Safari and play, then optionally Share → Add to Home Screen to keep your Best Score forever and play offline. Update the Android-only wording elsewhere where needed.
- **Manifest and meta.** Check that the Apple touch icon and Home Screen app title resolve correctly under the GitHub Pages base path, and that a status-bar style suits the dark theme.

## Testing Decisions

- **What makes a good test:** test only external behavior through each module's public interface: inputs in, facts or decisions out, saved state read back through Persistence. Don't assert on internal helpers, CSS class names or DOM structure.
- **Device facts:** table-driven tests with fake navigator and standalone inputs covering:
  - an iPhone in a Safari tab;
  - an iPhone Home Screen app;
  - an iPhone in a non-Safari browser;
  - Android Chrome, installed and not;
  - desktop;
  - vibration present and absent;
  - upright versus sideways sizes.

  Prior art: the haptics tests' injected fake navigator.
- **Home Screen Hint rule:** tests through the rule's public interface with the in-memory fake storage used by the existing Persistence and settings tests:
  - hidden after the first Game Over, shown from the second;
  - hidden after dismissal, including across a reload;
  - never shown for an iPhone Home Screen app, Android or desktop;
  - unrelated sections (Run, profile, settings) survive hint writes.
- **Layout:** new tests for the existing layout function across the target sizes:
  - iPhone SE in a Safari tab;
  - iPhone SE as a Home Screen app;
  - standard iPhones;
  - Pro Max;
  - a typical Android phone.

  They assert that the Board and all three Tray slots lie fully inside the space left after the top band and safe-area insets, that they don't overlap, and that the Board stays square and centered. Prior art: the pure-function tests across the feedback and renderer modules.
- **Not unit-tested, playtested instead:** Safari toolbars, swipe-back, zoom and bounce, the silent switch, audio after backgrounding, the upright overlay, the hint card's look, and Home Screen install and offline play. Playtest on the developer's iPhone 16 (iOS 27), in a Safari tab and as a Home Screen app, on the deployed site. Check the SE and Pro Max sizes in desktop Chrome's device mode. Re-check Android for regressions.

## Out of Scope

- App Store, TestFlight or any native wrapper (Capacitor, Cordova).
- Haptics on iPhone, including the web-haptics library and the hidden-switch trick.
- Shared or online high scores, accounts, leaderboards, and syncing progress between devices.
- Moving a player's progress between a Safari tab and the Home Screen app. They keep separate storage on iOS, and a player who installs later starts the installed app fresh.
- An install banner on Android, or a Home Screen Hint anywhere other than the Game Over screen.
- iPads, landscape layouts and desktop polish.
- iPhones older than iOS 17.

## Further Notes

- On iOS, a Safari tab and a Home Screen app keep separate saved data. A player who adds the game to their Home Screen after playing in Safari starts with a fresh Best Score in the installed app. The Home Screen Hint copy shouldn't promise that existing progress carries over.
- Safari's 7-day data wipe only applies when the site isn't opened for 7 days of Safari use. Regular players keep their data even in a tab, which is why the hint is a suggestion, not a requirement.
- Glossary: **Home Screen Hint** was added during the design session. ADR 0001 has a 2026-10 update for the wider audience.
