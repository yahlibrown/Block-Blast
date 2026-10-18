import { describe, expect, it } from "vitest";
import { deviceFacts, isUpright, type NavigatorLike } from "./deviceFacts";

const UA = {
  iPhoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  iPhoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  iPhoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  desktopChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
};

const vibrate = () => true;
const iPhone: NavigatorLike = { userAgent: UA.iPhoneSafari, maxTouchPoints: 5 };
const android: NavigatorLike = { userAgent: UA.androidChrome, maxTouchPoints: 5, vibrate };
const desktop: NavigatorLike = { userAgent: UA.desktopChrome, maxTouchPoints: 0, vibrate };

describe("device facts", () => {
  it.each<[string, NavigatorLike | undefined, boolean, { iPhoneSafariTab: boolean; vibrationSupported: boolean }]>([
    ["an iPhone in a Safari tab", iPhone, false, { iPhoneSafariTab: true, vibrationSupported: false }],
    ["an iPhone Home Screen app", iPhone, true, { iPhoneSafariTab: false, vibrationSupported: false }],
    [
      "an iPhone in Chrome",
      { userAgent: UA.iPhoneChrome, maxTouchPoints: 5 },
      false,
      { iPhoneSafariTab: true, vibrationSupported: false },
    ],
    [
      "an iPhone in Firefox",
      { userAgent: UA.iPhoneFirefox, maxTouchPoints: 5 },
      false,
      { iPhoneSafariTab: true, vibrationSupported: false },
    ],
    [
      "an iPhone in Safari asking for the desktop site (reports as a Mac with touch)",
      { userAgent: UA.macSafari, maxTouchPoints: 5 },
      false,
      { iPhoneSafariTab: true, vibrationSupported: false },
    ],
    ["Android Chrome in a tab", android, false, { iPhoneSafariTab: false, vibrationSupported: true }],
    ["Android Chrome installed", android, true, { iPhoneSafariTab: false, vibrationSupported: true }],
    ["desktop Chrome", desktop, false, { iPhoneSafariTab: false, vibrationSupported: true }],
    [
      "desktop Safari on a Mac",
      { userAgent: UA.macSafari, maxTouchPoints: 0 },
      false,
      { iPhoneSafariTab: false, vibrationSupported: false },
    ],
    ["no navigator at all", undefined, false, { iPhoneSafariTab: false, vibrationSupported: false }],
  ])("for %s", (_, navigator, standalone, expected) => {
    const facts = deviceFacts({ navigator, standalone, width: 393, height: 659 });

    expect({ iPhoneSafariTab: facts.iPhoneSafariTab, vibrationSupported: facts.vibrationSupported }).toEqual(expected);
  });

  it("support vibration only where vibrate is a function", () => {
    const at = (nav: NavigatorLike) => deviceFacts({ navigator: nav, standalone: false, width: 1, height: 2 });

    expect(at({ userAgent: UA.androidChrome, vibrate }).vibrationSupported).toBe(true);
    expect(at({ userAgent: UA.androidChrome }).vibrationSupported).toBe(false);
    expect(at({ userAgent: UA.androidChrome, vibrate: true }).vibrationSupported).toBe(false);
  });

  it.each([
    ["iPhone SE upright", 375, 553, true],
    ["Pro Max upright", 430, 739, true],
    ["a square window", 500, 500, true],
    ["iPhone SE sideways", 667, 375, false],
    ["Pro Max sideways", 932, 430, false],
  ])("treat %s as upright: %s", (_, width, height, upright) => {
    expect(deviceFacts({ navigator: iPhone, standalone: false, width, height }).upright).toBe(upright);
    expect(isUpright(width, height)).toBe(upright);
  });
});
