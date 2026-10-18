// Device facts: turns browser globals, passed in, into plain facts about the
// device the game runs on. Pure: no direct DOM access, so it runs in Node tests.
// The shell gathers the inputs (see `readDeviceInputs` in the shell) and asks again
// whenever they change (e.g. width and height on resize).

/** The slice of `Navigator` this module reads (inject a fake in tests). */
export interface NavigatorLike {
  readonly userAgent?: string;
  readonly maxTouchPoints?: number;
  readonly vibrate?: unknown;
}

export interface DeviceInputs {
  readonly navigator: NavigatorLike | undefined;
  /** Running as an installed Home Screen app (display-mode standalone, or iOS `navigator.standalone`). */
  readonly standalone: boolean;
  /**
   * The main input is a finger (`pointer: coarse`): a phone, not a desktop with a mouse.
   * Unknown counts as false, so a desktop window is never asked to turn upright.
   */
  readonly touchFirst?: boolean;
  /** The visible viewport, in CSS pixels. */
  readonly width: number;
  readonly height: number;
}

export interface DeviceFacts {
  /** The Vibration API is there to call. False on every iPhone browser and most desktops. */
  readonly vibrationSupported: boolean;
  /**
   * An iPhone playing in a browser tab rather than as a Home Screen app. Every
   * iPhone browser (Chrome, Firefox, …) counts: they all have Safari's limits.
   */
  readonly iPhoneSafariTab: boolean;
  /** The screen is portrait (or square), not sideways. */
  readonly upright: boolean;
  /**
   * A phone held sideways: the game asks the player to turn it upright and waits.
   * Desktop windows are usually wider than tall and are never asked.
   */
  readonly turnUpright: boolean;
}

export function deviceFacts(inputs: DeviceInputs): DeviceFacts {
  const iPhone = isIPhone(inputs.navigator);
  const upright = isUpright(inputs.width, inputs.height);
  return {
    vibrationSupported: typeof inputs.navigator?.vibrate === "function",
    iPhoneSafariTab: iPhone && !inputs.standalone,
    upright,
    turnUpright: !upright && inputs.touchFirst === true,
  };
}

/** Portrait or square; sideways only when wider than tall. */
export function isUpright(width: number, height: number): boolean {
  return height >= width;
}

function isIPhone(nav: NavigatorLike | undefined): boolean {
  const ua = nav?.userAgent ?? "";
  if (/iPhone|iPod/.test(ua)) return true;
  // Safari's "Request Desktop Website" reports a Mac; only the touch screen gives it
  // away. iPads look the same: they aren't targeted, and they share Safari's limits.
  return /Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1;
}
