# 09: Home Screen Hint steps that match the player's Safari

**What to build:** The Home Screen Hint shows short numbered steps, each with its icon, that match the player's browser:
- **Safari on iOS 26 and later:** ① tap ••• ② Share ③ View More ④ Add to Home Screen.
- **Safari on older iOS:** ① tap Share ② Add to Home Screen.
- **Other iPhone browsers (Chrome, Firefox, Edge):** "Open your browser's Share menu, then Add to Home Screen".

The card stays dismissable and stays under "Play again". Found in the ticket 08 playtest: on iOS 27, Share is behind •••, and Add to Home Screen is behind View More.

**Blocked by:** None (can start immediately)

**Status:** implemented (awaiting phone playtest)

- [x] A pure rule picks the steps from the browser's user agent, and tests cover Safari 26+, Safari 18, Chrome on iOS, Firefox on iOS, and unknown or missing versions (these fall back to the iOS 26+ steps)
- [x] The card shows the chosen steps as a numbered list with icons
- [ ] Checked on the iPhone: the steps match what Safari shows

## Comments
