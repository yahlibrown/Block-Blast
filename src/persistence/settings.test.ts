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
    expect(loadSettings(createPersistence(memoryStorage()))).toEqual({ sound: true, haptics: true });
  });

  it("survive a reload", () => {
    const storage = memoryStorage();
    saveSettings(createPersistence(storage), { sound: false, haptics: true });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: false, haptics: true });
  });

  it.each([
    ["a string", "loud"],
    ["an array", [false, false]],
    ["null", null],
  ])("fall back to defaults when the saved section is %s", (_, section) => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, settings: section }) });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: true });
  });

  it("fall back per field when only one value is invalid", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { sound: "off", haptics: false } }),
    });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: false });
  });

  it("fall back to defaults when the storage is unreadable", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{not json" });

    expect(loadSettings(createPersistence(storage))).toEqual({ sound: true, haptics: true });
  });

  it("keep the saved Run when they change", () => {
    const storage = memoryStorage();
    const persistence = createPersistence(storage);
    const run = persistence.loadRun({ seed: 7 });
    persistence.saveRun(run);

    saveSettings(persistence, { sound: false, haptics: false });

    expect(createPersistence(storage).loadRun({ seed: 99 }).tray).toEqual(run.tray);
  });
});
