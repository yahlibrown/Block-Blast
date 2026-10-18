import { describe, expect, it } from "vitest";
import { homeScreenSteps } from "./homeScreenSteps";

const iPhoneSafari = (version: string) =>
  `Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Mobile/15E148 Safari/604.1`;
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1";
const IPHONE_FIREFOX =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15";
const IPHONE_EDGE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.0 Mobile/15E148 Safari/605.1.15";
const IN_APP_BROWSER =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0";

const labels = (ua: string | undefined) => homeScreenSteps(ua).map((s) => s.label);

describe("Home Screen Hint steps", () => {
  it("walks Safari 26 and later through ••• → Share → View More", () => {
    for (const v of ["26.0", "27.1"]) {
      expect(labels(iPhoneSafari(v))).toEqual(["Tap •••", "Share", "View More", "Add to Home Screen"]);
    }
  });

  it("uses the toolbar Share button on older Safari", () => {
    for (const v of ["17.4", "18.6"]) {
      expect(labels(iPhoneSafari(v))).toEqual(["Tap Share", "Add to Home Screen"]);
    }
  });

  it("gives other iPhone browsers one generic step", () => {
    for (const ua of [IPHONE_CHROME, IPHONE_FIREFOX, IPHONE_EDGE, IN_APP_BROWSER]) {
      expect(labels(ua)).toEqual(["Open your browser's Share menu, then Add to Home Screen"]);
    }
  });

  it("falls back to the newest Safari steps when the version is unknown", () => {
    const noVersion = iPhoneSafari("x").replace("Version/x ", "");
    expect(labels(noVersion)).toEqual(["Tap •••", "Share", "View More", "Add to Home Screen"]);
    expect(labels(undefined)).toEqual(["Tap •••", "Share", "View More", "Add to Home Screen"]);
  });

  it("marks the steps that show an icon", () => {
    expect(homeScreenSteps(iPhoneSafari("26.0")).map((s) => s.icon)).toEqual(["more", "share", undefined, "add"]);
    expect(homeScreenSteps(iPhoneSafari("18.6")).map((s) => s.icon)).toEqual(["share", "add"]);
  });
});
