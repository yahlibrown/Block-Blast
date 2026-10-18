import { describe, expect, it } from "vitest";
import { createPersistence, type StorageLike } from "./persistence";
import { createHomeScreenHint } from "./homeScreenHint";
import { deviceFacts } from "../device/deviceFacts";
import { loadSettings, saveSettings } from "./settings";

function memoryStorage(): StorageLike {
  const data: Record<string, string> = {};
  return {
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

const device = (userAgent: string, standalone: boolean) =>
  deviceFacts({ navigator: { userAgent, maxTouchPoints: 5 }, standalone, width: 390, height: 844 });

const safariTab = device(IPHONE_SAFARI, false);

describe("Home Screen Hint", () => {
  it("is hidden after the first Game Over and shown from the second", () => {
    const hint = createHomeScreenHint(createPersistence(memoryStorage()), safariTab);

    expect(hint.shown).toBe(false);
    hint.reachedGameOver();
    expect(hint.shown).toBe(false);
    hint.reachedGameOver();
    expect(hint.shown).toBe(true);
    hint.reachedGameOver();
    expect(hint.shown).toBe(true);
  });

  it("stays hidden once dismissed, including across a reload", () => {
    const storage = memoryStorage();
    const hint = createHomeScreenHint(createPersistence(storage), safariTab);
    hint.reachedGameOver();
    hint.reachedGameOver();

    hint.dismiss();
    expect(hint.shown).toBe(false);

    const reloaded = createHomeScreenHint(createPersistence(storage), safariTab);
    reloaded.reachedGameOver();
    expect(reloaded.shown).toBe(false);
  });

  it("counts Game Overs across a reload", () => {
    const storage = memoryStorage();
    createHomeScreenHint(createPersistence(storage), safariTab).reachedGameOver();

    const reloaded = createHomeScreenHint(createPersistence(storage), safariTab);
    expect(reloaded.shown).toBe(false);
    reloaded.reachedGameOver();
    expect(reloaded.shown).toBe(true);
  });

  it.each([
    ["an iPhone Home Screen app", device(IPHONE_SAFARI, true)],
    ["Android Chrome", device(ANDROID_CHROME, false)],
    ["an installed Android app", device(ANDROID_CHROME, true)],
    ["desktop", device(DESKTOP_CHROME, false)],
  ])("never shows on %s", (_, facts) => {
    const hint = createHomeScreenHint(createPersistence(memoryStorage()), facts);
    for (let i = 0; i < 5; i++) hint.reachedGameOver();

    expect(hint.shown).toBe(false);
  });

  it("keeps the Run, profile and settings when it saves", () => {
    const storage = memoryStorage();
    const persistence = createPersistence(storage);
    const run = persistence.loadRun({ seed: 7 });
    persistence.saveRun({ ...run, best: 1234 });
    saveSettings(persistence, { sound: false, haptics: false, skin: "classic" });

    const hint = createHomeScreenHint(persistence, safariTab);
    hint.reachedGameOver();
    hint.reachedGameOver();
    hint.dismiss();

    const reloaded = createPersistence(storage);
    const restored = reloaded.loadRun({ seed: 99 });
    expect(restored.tray).toEqual(run.tray);
    expect(restored.best).toBe(1234);
    expect(loadSettings(reloaded)).toEqual({ sound: false, haptics: false, skin: "classic" });
  });
});
