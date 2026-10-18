# 02: Device facts, and no vibration toggle where it can't vibrate

**What to build:** A small, pure **device facts** module that turns browser globals, passed in (a navigator-like object, a standalone check, width and height), into plain facts:
- whether vibration is supported;
- whether this is an iPhone in a Safari tab, as opposed to the Home Screen app or any non-iPhone browser;
- whether the screen is upright.

It must recognise iPhones even in non-Safari browsers, since every iPhone browser has Safari's limits. It has no direct DOM access.

Its first use: the settings sheet only shows the vibration toggle where vibration is supported. The toggle disappears on iPhone and stays on Android. The saved haptics setting itself is untouched. Don't add web-haptics or the hidden-switch trick (see the spec's Out of Scope).

See the spec: Play on iPhone.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Table-driven tests with fake inputs cover:
  - an iPhone in a Safari tab;
  - an iPhone Home Screen app;
  - an iPhone in a non-Safari browser;
  - Android Chrome, installed and not;
  - desktop;
  - vibration present and absent;
  - upright and sideways sizes
- [ ] The vibration toggle is absent where vibration is unsupported and present where it is
- [ ] A saved haptics setting is preserved whether or not the toggle is shown
- [ ] Checked on the iPhone: there's no vibration toggle in settings. Checked on Android: the toggle is there and vibration still works

## Comments
