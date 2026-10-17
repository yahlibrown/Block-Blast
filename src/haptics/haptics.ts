// Haptics: a thin wrapper over the Vibration API (`navigator.vibrate`).
// Respects the haptics setting via `enabled`, and does nothing (never throws)
// where vibration is unsupported, e.g. iPhone Safari or desktop browsers.

/** The slice of `Navigator` this module uses (inject a fake in tests). */
export interface VibrateLike {
  vibrate?: (pattern: number | number[]) => boolean;
}

export interface Haptics {
  /** The haptics setting; while false, `vibrate` does nothing. */
  enabled: boolean;
  /** Vibration pattern in ms: on, off, on, … */
  vibrate(pattern: readonly number[]): void;
}

export function createHaptics(nav: VibrateLike | undefined): Haptics {
  return {
    enabled: true,
    vibrate(pattern) {
      if (!this.enabled || typeof nav?.vibrate !== "function") return;
      try {
        nav.vibrate([...pattern]);
      } catch {
        // Blocked (e.g. no user gesture yet): skip this one.
      }
    },
  };
}
