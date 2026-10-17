// Player settings (sound, haptics, chosen Skin), saved as the "settings" section
// of the persistence envelope. Whatever is read back is validated field by
// field: anything missing or invalid falls back to its default.
import { isSkinId, SKINS, type SkinId } from "../core";
import type { Persistence } from "./persistence";

export interface Settings {
  readonly sound: boolean;
  readonly haptics: boolean;
  /** The chosen Skin. The shell falls back to the first Skin if it isn't unlocked. */
  readonly skin: SkinId;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, skin: SKINS[0]!.id };

const SECTION = "settings";

export function loadSettings(persistence: Persistence): Settings {
  const raw = persistence.readSection(SECTION);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return DEFAULT_SETTINGS;
  const record = raw as Record<string, unknown>;
  return {
    sound: typeof record.sound === "boolean" ? record.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof record.haptics === "boolean" ? record.haptics : DEFAULT_SETTINGS.haptics,
    skin: isSkinId(record.skin) ? record.skin : DEFAULT_SETTINGS.skin,
  };
}

export function saveSettings(persistence: Persistence, settings: Settings): void {
  persistence.writeSection(SECTION, { sound: settings.sound, haptics: settings.haptics, skin: settings.skin });
}
