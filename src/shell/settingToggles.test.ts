import { describe, expect, it } from "vitest";
import { createPersistence, type StorageLike } from "../persistence/persistence";
import { loadSettings, saveSettings } from "../persistence/settings";
import { settingToggles } from "./settingToggles";

function memoryStorage(): StorageLike {
  const data: Record<string, string> = {};
  return {
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe("setting toggles", () => {
  it("offer Sound and Vibration where vibration is supported", () => {
    expect(settingToggles({ vibrationSupported: true }).map((t) => t.label)).toEqual(["Sound", "Vibration"]);
  });

  it("offer no Vibration toggle where vibration is unsupported", () => {
    expect(settingToggles({ vibrationSupported: false }).map((t) => t.label)).toEqual(["Sound"]);
  });

  it.each([true, false])(
    "keep the saved haptics setting when every shown toggle is used (vibration supported: %s)",
    (vibrationSupported) => {
      const persistence = createPersistence(memoryStorage());
      saveSettings(persistence, { sound: true, haptics: false, skin: "classic" });

      for (const toggle of settingToggles({ vibrationSupported })) {
        if (toggle.key === "haptics") continue; // the player leaves Vibration alone
        saveSettings(persistence, { ...loadSettings(persistence), [toggle.key]: false });
      }

      expect(loadSettings(persistence)).toEqual({ sound: false, haptics: false, skin: "classic" });
    },
  );
});
