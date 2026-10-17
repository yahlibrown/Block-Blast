import { describe, expect, it } from "vitest";
import { createPersistence, STORAGE_KEY, type StorageLike } from "./persistence";
import { loadSettings, saveSettings } from "./settings";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe("settings", () => {
  it("default to sound and haptics both on", () => {
    expect(loadSettings(createPersistence(memoryStorage()))).toEqual({ sound: true, haptics: true, skin: "classic" });
  });

  it("survive a reload", () => {
    const storage = memoryStorage();
    saveSettings(createPersistence(storage), { sound: false, haptics: true, skin: "classic" });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: false, haptics: true, skin: "classic" });
  });

  it.each([
    ["a string", "loud"],
    ["an array", [false, false]],
    ["null", null],
  ])("fall back to defaults when the saved section is %s", (_, section) => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, settings: section }) });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: true, skin: "classic" });
  });

  it("fall back per field when only one value is invalid", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { sound: "off", haptics: false } }),
    });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: false, skin: "classic" });
  });

  it("fall back to defaults when the storage is unreadable", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{not json" });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: true, skin: "classic" });
  });

  it("remember the chosen Skin across a reload", () => {
    const storage = memoryStorage();
    saveSettings(createPersistence(storage), { sound: true, haptics: true, skin: "neon" });

    expect(loadSettings(createPersistence(storage)).skin).toBe("neon");
  });

  it.each([["an unknown Skin", "plaid"], ["a number", 2], ["missing", undefined]])(
    "fall back to the first Skin when the saved Skin is %s",
    (_, skin) => {
      const storage = memoryStorage({
        [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { sound: false, haptics: false, skin } }),
      });

      expect(loadSettings(createPersistence(storage))).toEqual({ sound: false, haptics: false, skin: "classic" });
    },
  );

  it("keep the saved Run when they change", () => {
    const storage = memoryStorage();
    const persistence = createPersistence(storage);
    const run = persistence.loadRun({ seed: 7 });
    persistence.saveRun(run);

    saveSettings(persistence, { sound: false, haptics: false, skin: "classic" });

    expect(createPersistence(storage).loadRun({ seed: 99 }).tray).toEqual(run.tray);
  });
});
