import { describe, expect, it } from "vitest";
import { createHaptics } from "./haptics";

function fakeNavigator() {
  const calls: (number | number[])[] = [];
  return {
    calls,
    vibrate: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
  };
}

describe("haptics", () => {
  it("vibrate with the given pattern", () => {
    const nav = fakeNavigator();

    createHaptics(nav).vibrate([30, 20, 30]);

    expect(nav.calls).toEqual([[30, 20, 30]]);
  });

  it("do nothing while turned off, and resume when turned back on", () => {
    const nav = fakeNavigator();
    const haptics = createHaptics(nav);

    haptics.enabled = false;
    haptics.vibrate([30]);
    haptics.enabled = true;
    haptics.vibrate([40]);

    expect(nav.calls).toEqual([[40]]);
  });

  it("do nothing, without errors, where vibration is unsupported", () => {
    expect(() => createHaptics({}).vibrate([30])).not.toThrow();
    expect(() => createHaptics(undefined).vibrate([30])).not.toThrow();
  });

  it("swallow errors the browser throws", () => {
    const haptics = createHaptics({
      vibrate: () => {
        throw new Error("blocked");
      },
    });

    expect(() => haptics.vibrate([30])).not.toThrow();
  });
});
