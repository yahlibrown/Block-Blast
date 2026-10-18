// Which on/off switches the settings sheet offers on this device. Vibration only
// shows where the device can vibrate (not on any iPhone). The saved haptics
// setting is kept either way, so a save that reaches a phone that can vibrate still works.
import type { DeviceFacts } from "../device/deviceFacts";
import type { Settings } from "../persistence/settings";

export interface SettingToggle {
  readonly key: keyof Settings & ("sound" | "haptics");
  readonly label: string;
}

export function settingToggles(facts: Pick<DeviceFacts, "vibrationSupported">): readonly SettingToggle[] {
  const toggles: SettingToggle[] = [{ key: "sound", label: "Sound" }];
  if (facts.vibrationSupported) toggles.push({ key: "haptics", label: "Vibration" });
  return toggles;
}
