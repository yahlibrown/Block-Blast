import { describe, expect, it } from "vitest";
import { requestPersistentStorage } from "./persistentStorage";

/** Node's process events (tests run in Node; the app's tsconfig has no Node types). */
declare const process: {
  on(event: "unhandledRejection", listener: (reason: unknown) => void): void;
  off(event: "unhandledRejection", listener: (reason: unknown) => void): void;
};

describe("persistent storage request", () => {
  it("asks the browser to keep the site's data", () => {
    let asked = 0;
    requestPersistentStorage({
      storage: {
        persist: async () => {
          asked++;
          return true;
        },
      },
    });

    expect(asked).toBe(1);
  });

  const UA = {
    iPhoneSafari:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    iPhoneFirefox:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
    desktopChrome:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    desktopFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0",
  };
  const asks = (userAgent: string) => {
    let asked = 0;
    requestPersistentStorage({
      userAgent,
      storage: {
        persist: async () => {
          asked++;
          return true;
        },
      },
    });
    return asked > 0;
  };

  it.each([
    ["an iPhone in Safari", UA.iPhoneSafari],
    ["an iPhone in Firefox (WebKit underneath)", UA.iPhoneFirefox],
    ["Chrome", UA.desktopChrome],
  ])("asks silently on %s", (_, userAgent) => {
    expect(asks(userAgent)).toBe(true);
  });

  it.each([
    ["desktop Firefox", UA.desktopFirefox],
    ["Firefox on Android", UA.androidFirefox],
  ])("never asks on %s, where it would show a permission prompt", (_, userAgent) => {
    expect(asks(userAgent)).toBe(false);
  });

  it.each([
    ["no navigator", undefined],
    ["no storage manager", {}],
    ["no persist()", { storage: {} }],
    [
      "persist() throwing",
      {
        storage: {
          persist: () => {
            throw new Error("blocked");
          },
        },
      },
    ],
    ["persist() refusing", { storage: { persist: () => Promise.resolve(false) } }],
  ])("never throws with %s", (_, nav) => {
    expect(() => requestPersistentStorage(nav)).not.toThrow();
  });

  it("swallows a rejected request", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      requestPersistentStorage({ storage: { persist: () => Promise.reject(new Error("denied")) } });
      await new Promise((resolve) => setTimeout(resolve, 10));
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }

    expect(unhandled).toEqual([]);
  });

  it("returns at once without waiting for the answer", () => {
    expect(requestPersistentStorage({ storage: { persist: () => new Promise<boolean>(() => {}) } })).toBeUndefined();
  });
});
